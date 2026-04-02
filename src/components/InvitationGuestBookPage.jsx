import { useEffect, useRef, useState } from "react";
import { normalizePackageTier } from "../data/packageCatalog";
import { fetchInvitationWishListBySlug } from "../services/invitationApi";
import { postInvitationWish } from "../services/wishesApi";
import { getInvitationSlugFromPath, toAppPath } from "../utils/navigation";
import { readGuestQueryParams } from "../utils/guestParams";
import {
  humanizeInvitationSlug,
  pickText,
  resolveInvitationPackageTier,
} from "../utils/invitationMetadata";

const SCAN_STORAGE_PREFIX = "ikc_guestbook_scan_history_v1:";
const QR_SCAN_THROTTLE_MS = 2500;
const SCAN_POPUP_DURATION_MS = 3200;

function normalizeAttendance(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ");

  if (!normalized) return "belum_konfirmasi";
  if (normalized.includes("tidak")) return "tidak_hadir";
  if (normalized.includes("hadir")) return "hadir";
  if (normalized.includes("ragu")) return "ragu_ragu";
  return normalized.replace(/\s+/g, "_");
}

function formatAttendanceLabel(value) {
  const normalized = normalizeAttendance(value);
  if (normalized === "hadir") return "Hadir";
  if (normalized === "tidak_hadir") return "Tidak hadir";
  if (normalized === "ragu_ragu") return "Ragu-ragu";
  if (normalized === "belum_konfirmasi") return "Belum konfirmasi";
  return normalized
    .split("_")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
    .join(" ");
}

function formatDateTime(value) {
  const text = pickText(value);
  if (!text) return "-";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeWishRecord(record, index, fallbackSlug, fallbackOrderId) {
  return {
    wishId: pickText(record?.wishId, record?.wish_id, `wish-${index + 1}`),
    invitationSlug: pickText(record?.invitationSlug, record?.invitation_slug, fallbackSlug),
    orderId: pickText(record?.orderId, record?.order_id, fallbackOrderId) || null,
    name: pickText(record?.name, record?.author, "Anonim"),
    attendance: normalizeAttendance(record?.attendance),
    message: pickText(record?.message, record?.comment),
    source: pickText(record?.source, record?.entrySource, record?.entry_source, "guest_wish").toLowerCase(),
    createdAt: pickText(record?.createdAt, record?.created_at),
  };
}

function normalizeGuestKey(value) {
  return pickText(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function extractInvitationSlugFromUrlPath(pathname) {
  const match = String(pathname || "").match(/\/undangan\/([^/]+)/i);
  if (!match?.[1]) return "";

  try {
    return decodeURIComponent(match[1]).trim().toLowerCase();
  } catch {
    return String(match[1]).trim().toLowerCase();
  }
}

function extractGuestAttendancePayload(rawValue, expectedSlug) {
  const text = pickText(rawValue);
  if (!text) return null;

  try {
    const url = new URL(text, window.location.origin);
    const invitationSlug = extractInvitationSlugFromUrlPath(url.pathname);
    const guestQuery = readGuestQueryParams(url.search);
    const guestName = pickText(guestQuery.name);

    if (!invitationSlug || !guestName) return null;
    if (expectedSlug && invitationSlug !== String(expectedSlug).trim().toLowerCase()) return null;

    return {
      invitationSlug,
      sourceUrl: url.toString(),
      name: guestName,
      attendance: "hadir",
    };
  } catch {
    return null;
  }
}

function normalizeTokenVariants(value) {
  const text = pickText(value).toLowerCase();
  if (!text) return [];

  return Array.from(
    new Set([
      text,
      text.replace(/\s+/g, " ").trim(),
      text.replace(/[^a-z0-9]/g, ""),
    ].filter(Boolean))
  );
}

function collectPrimitiveValues(value, bucket) {
  if (value === null || value === undefined) return;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    bucket.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectPrimitiveValues(item, bucket));
    return;
  }

  if (typeof value === "object") {
    Object.values(value).forEach((item) => collectPrimitiveValues(item, bucket));
  }
}

function extractScanTokens(rawValue) {
  const text = pickText(rawValue);
  if (!text) return [];

  const values = [text];

  try {
    const parsed = JSON.parse(text);
    collectPrimitiveValues(parsed, values);
  } catch {
    // ignore non-JSON payloads
  }

  try {
    const url = new URL(text);
    values.push(url.href, url.pathname);
    url.searchParams.forEach((paramValue, key) => {
      values.push(key, paramValue);
    });
  } catch {
    // ignore non-URL payloads
  }

  return Array.from(new Set(values.flatMap((item) => normalizeTokenVariants(item))));
}

function buildWishTokens(record) {
  return Array.from(
    new Set(
      [
        record.wishId,
        record.invitationSlug,
        record.orderId,
        record.name,
        `${record.name} ${record.invitationSlug}`,
        `${record.name} ${record.orderId || ""}`,
      ].flatMap((item) => normalizeTokenVariants(item))
    )
  );
}

function isQrCheckInWish(record) {
  const source = pickText(record?.source).toLowerCase();
  if (source === "qr_checkin") return true;
  return pickText(record?.message) === "Check-in via QR tamu.";
}

function findExistingQrCheckInWish(wishes, guestAttendancePayload) {
  if (!guestAttendancePayload) return null;

  return (
    wishes.find(
      (wish) => isQrCheckInWish(wish) && normalizeGuestKey(wish.name) === normalizeGuestKey(guestAttendancePayload.name)
    ) || null
  );
}

function resolveScanMatch(rawValue, wishes) {
  const scanTokens = extractScanTokens(rawValue);
  if (!scanTokens.length) return null;

  return (
    wishes.find((wish) => {
      const wishTokens = buildWishTokens(wish);
      return scanTokens.some((token) => wishTokens.includes(token));
    }) || null
  );
}

function readScanHistory(slug) {
  if (!slug) return [];

  try {
    const raw = window.sessionStorage.getItem(`${SCAN_STORAGE_PREFIX}${slug}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeScanHistory(slug, entries) {
  if (!slug) return;

  try {
    window.sessionStorage.setItem(`${SCAN_STORAGE_PREFIX}${slug}`, JSON.stringify(entries.slice(0, 25)));
  } catch {
    // ignore session storage failures
  }
}

function createScanEntry(rawValue, options = {}) {
  const {
    status = "unmatched",
    matchedRecordId = null,
    matchedName = "",
    matchedAttendance = "",
  } = options;

  return {
    id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    rawValue,
    scannedAt: new Date().toISOString(),
    status,
    matchedWishId: matchedRecordId,
    matchedName,
    matchedAttendance,
  };
}

function getAttendanceBadgeClass(attendance) {
  const normalized = normalizeAttendance(attendance);
  if (normalized === "hadir") return "bg-emerald-100 text-emerald-700";
  if (normalized === "tidak_hadir") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function getPackageTagClass(packageTier) {
  if (packageTier === "EKSKLUSIF") return "bg-slate-900 text-white";
  return "bg-amber-100 text-amber-800";
}

function getScanPopupClass(type) {
  if (type === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (type === "warning") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
}

function triggerHapticFeedback(type) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;

  if (type === "success") {
    navigator.vibrate([80]);
    return;
  }

  if (type === "warning") {
    navigator.vibrate([60, 40, 60]);
    return;
  }

  navigator.vibrate([140, 60, 140]);
}

export default function InvitationGuestBookPage() {
  const invitationSlug = getInvitationSlugFromPath();
  const [guestBookMeta, setGuestBookMeta] = useState(null);
  const [wishRecords, setWishRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [scanHistory, setScanHistory] = useState([]);
  const [manualScanValue, setManualScanValue] = useState("");
  const [scannerState, setScannerState] = useState("idle");
  const [scannerMessage, setScannerMessage] = useState("");
  const [scanPopup, setScanPopup] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const lastDetectedRef = useRef({ value: "", at: 0 });
  const pendingGuestKeysRef = useRef(new Set());
  const processingScanRef = useRef(false);
  const popupTimerRef = useRef(0);
  const audioContextRef = useRef(null);

  const packageTier = normalizePackageTier(resolveInvitationPackageTier(guestBookMeta));
  const coupleLabel = humanizeInvitationSlug(invitationSlug);
  const qrModeEnabled = packageTier === "EKSKLUSIF";
  const canUseCameraScan = typeof window !== "undefined" && Boolean(navigator?.mediaDevices?.getUserMedia);

  async function ensureAudioFeedbackReady() {
    if (typeof window === "undefined") return null;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch {
        return null;
      }
    }

    return audioContextRef.current;
  }

  async function playScanFeedbackTone(type) {
    const audioContext = await ensureAudioFeedbackReady();
    if (!audioContext) return;

    const now = audioContext.currentTime;
    const pattern =
      type === "success"
        ? [
            { frequency: 880, duration: 0.08, delay: 0 },
            { frequency: 1174, duration: 0.11, delay: 0.1 },
          ]
        : type === "warning"
          ? [
              { frequency: 540, duration: 0.09, delay: 0 },
              { frequency: 540, duration: 0.09, delay: 0.14 },
            ]
          : [
              { frequency: 280, duration: 0.16, delay: 0 },
              { frequency: 220, duration: 0.16, delay: 0.2 },
            ];

    pattern.forEach((tone) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const startAt = now + tone.delay;
      const endAt = startAt + tone.duration;

      oscillator.type = type === "success" ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(tone.frequency, startAt);

      gainNode.gain.setValueAtTime(0.0001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(0.08, startAt + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt);
    });
  }

  function showScanPopupMessage(type, title, message) {
    if (popupTimerRef.current) {
      window.clearTimeout(popupTimerRef.current);
    }

    setScanPopup({
      id: `scan_popup_${Date.now()}`,
      type,
      title,
      message,
    });

    triggerHapticFeedback(type);
    void playScanFeedbackTone(type);

    popupTimerRef.current = window.setTimeout(() => {
      setScanPopup(null);
      popupTimerRef.current = 0;
    }, SCAN_POPUP_DURATION_MS);
  }

  async function stopScanner(nextState = "idle") {
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
      } catch {
        // ignore stop errors
      }
    }

    setScannerState(nextState);
  }

  async function loadGuestBook({ silent = false } = {}) {
    if (!invitationSlug) {
      setGuestBookMeta(null);
      setWishRecords([]);
      setError("Slug undangan tidak valid.");
      setLoading(false);
      return;
    }

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const nextWishPayload = await fetchInvitationWishListBySlug(invitationSlug);

      const normalizedWishes = (Array.isArray(nextWishPayload?.wishes) ? nextWishPayload.wishes : []).map((record, index) =>
        normalizeWishRecord(record, index, invitationSlug, nextWishPayload?.orderId || null)
      );

      normalizedWishes.sort((left, right) => {
        const leftTime = new Date(left.createdAt || 0).getTime();
        const rightTime = new Date(right.createdAt || 0).getTime();
        return rightTime - leftTime;
      });

      setGuestBookMeta({
        invitationSlug: nextWishPayload?.invitationSlug || invitationSlug,
        orderId: nextWishPayload?.orderId || null,
        packageTier: nextWishPayload?.packageTier || null,
        themeSlug: nextWishPayload?.themeSlug || null,
        orderStatus: nextWishPayload?.orderStatus || null,
        publishedAt: nextWishPayload?.publishedAt || null,
        isPublished: nextWishPayload?.isPublished ?? true,
      });
      setWishRecords(normalizedWishes);
    } catch (err) {
      setGuestBookMeta(null);
      setWishRecords([]);
      setError(err?.message || "Gagal memuat buku tamu.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadGuestBook();
    return () => {
      void stopScanner();
      if (popupTimerRef.current) {
        window.clearTimeout(popupTimerRef.current);
        popupTimerRef.current = 0;
      }
      if (audioContextRef.current && typeof audioContextRef.current.close === "function") {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationSlug]);

  useEffect(() => {
    setScanHistory(readScanHistory(invitationSlug));
  }, [invitationSlug]);

  useEffect(() => {
    writeScanHistory(invitationSlug, scanHistory);
  }, [invitationSlug, scanHistory]);

  async function startScanner() {
    if (!qrModeEnabled) return;
    if (processingScanRef.current) return;

    if (!canUseCameraScan) {
      setScannerMessage("Browser ini tidak mendukung akses kamera. Gunakan input manual di bawah.");
      showScanPopupMessage("error", "Scanner tidak tersedia", "Browser ini tidak mendukung akses kamera untuk scan QR.");
      return;
    }

    try {
      setScannerMessage("Membuka kamera...");
      setScannerState("starting");
      await ensureAudioFeedbackReady();
      const [{ default: QrScanner }] = await Promise.all([import("qr-scanner")]);
      const video = videoRef.current;

      if (!video) {
        throw new Error("Elemen video scanner tidak tersedia.");
      }

      if (!qrScannerRef.current) {
        qrScannerRef.current = new QrScanner(
          video,
          (result) => {
            const rawValue = pickText(result?.data, result);
            if (!rawValue || processingScanRef.current) return;

            const now = Date.now();
            const lastDetected = lastDetectedRef.current;
            if (lastDetected.value === rawValue && now - lastDetected.at <= QR_SCAN_THROTTLE_MS) {
              return;
            }

            processingScanRef.current = true;
            lastDetectedRef.current = { value: rawValue, at: now };
            void (async () => {
              setScannerMessage("QR terbaca. Memproses ke backend...");
              await stopScanner("processing");

              try {
                await registerScan(rawValue);
              } finally {
                processingScanRef.current = false;
                setScannerState("idle");
                setScannerMessage("Proses selesai. Klik Scan Lagi untuk tamu berikutnya.");
              }
            })();
          },
          {
            preferredCamera: "environment",
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 12,
            returnDetailedScanResult: true,
            onDecodeError: () => {
              // ignore per-frame decode misses
            },
          }
        );
      }

      await qrScannerRef.current.start();
      setScannerState("active");
      setScannerMessage("Arahkan QR tamu ke kamera.");
    } catch (err) {
      setScannerState("idle");
      const nextMessage = err?.message || "Akses kamera ditolak atau tidak tersedia.";
      setScannerMessage(nextMessage);
      showScanPopupMessage("error", "Gagal membuka kamera", nextMessage);
    }
  }

  async function registerScan(rawValue) {
    const guestAttendancePayload = extractGuestAttendancePayload(rawValue, invitationSlug);
    const existingQrWish = findExistingQrCheckInWish(wishRecords, guestAttendancePayload);
    const matchedWish = guestAttendancePayload ? existingQrWish : resolveScanMatch(rawValue, wishRecords);
    const pendingGuestKey = guestAttendancePayload
      ? normalizeGuestKey(guestAttendancePayload.sourceUrl || guestAttendancePayload.name)
      : "";
    const pendingGuestDetected = pendingGuestKey ? pendingGuestKeysRef.current.has(pendingGuestKey) : false;

    if (guestAttendancePayload && pendingGuestDetected) {
      setScannerMessage("Menyimpan kehadiran QR ke backend...");
      return;
    }

    const duplicateWish = matchedWish
      ? scanHistory.some((entry) => entry.matchedWishId && entry.matchedWishId === matchedWish.wishId)
      : false;
    const duplicateGuest = Boolean(existingQrWish) || pendingGuestDetected;
    const duplicateDetected = duplicateWish || duplicateGuest;

    let matchedRecordId = matchedWish?.wishId || null;
    let matchedName = matchedWish?.name || "";
    let matchedAttendance = matchedWish?.attendance || "";

    if (guestAttendancePayload) {
      matchedName = matchedName || guestAttendancePayload.name;
      matchedAttendance = matchedAttendance || guestAttendancePayload.attendance;
    }

    const hasMatch = Boolean(matchedWish || guestAttendancePayload);
    let status = hasMatch ? (duplicateDetected ? "duplicate" : "matched") : "unmatched";

    if (guestAttendancePayload && !matchedWish && !duplicateDetected && pendingGuestKey) {
      setScannerMessage("Menyimpan kehadiran QR ke backend...");
      pendingGuestKeysRef.current.add(pendingGuestKey);

      try {
        const response = await postInvitationWish(invitationSlug, {
          invitationSlug,
          name: guestAttendancePayload.name,
          attendance: guestAttendancePayload.attendance,
          message: "Check-in via QR tamu.",
          source: "qr_checkin",
        });
        const createdRecord = normalizeWishRecord(response?.data, 0, invitationSlug, response?.data?.orderId || null);
        matchedRecordId = createdRecord.wishId;
        matchedName = createdRecord.name;
        matchedAttendance = createdRecord.attendance;
        setScannerMessage("Kehadiran QR berhasil disimpan.");
        showScanPopupMessage("success", "Scan berhasil", `${createdRecord.name} berhasil dicatat sebagai hadir.`);
        await loadGuestBook({ silent: true });
      } catch (err) {
        const nextMessage = err?.message || "Gagal menyimpan kehadiran QR ke backend.";

        if (err?.status === 409) {
          status = "duplicate";
          matchedName = matchedName || guestAttendancePayload.name;
          matchedAttendance = matchedAttendance || guestAttendancePayload.attendance;
          setScannerMessage(nextMessage);
        } else {
          status = "unmatched";
          matchedRecordId = null;
          matchedAttendance = "";
          setScannerMessage(nextMessage);
          showScanPopupMessage("error", "Gagal menyimpan", nextMessage);
        }
      } finally {
        pendingGuestKeysRef.current.delete(pendingGuestKey);
      }
    }

    if (status === "duplicate") {
      showScanPopupMessage("warning", "QR sudah pernah discan", matchedName ? `${matchedName} sudah tercatat sebelumnya.` : "Data tamu ini sudah pernah dicatat.");
    } else if (status === "unmatched") {
      showScanPopupMessage("error", "QR tidak valid", "QR ini tidak cocok dengan undangan atau data tamu yang sedang dibuka.");
    }

    setScanHistory((current) => {
      const rawDuplicate = !hasMatch ? current.some((entry) => entry.rawValue === rawValue) : false;
      const nextEntry = createScanEntry(rawValue, {
        status: rawDuplicate ? "duplicate" : status,
        matchedRecordId,
        matchedName,
        matchedAttendance,
      });
      return [nextEntry, ...current].slice(0, 25);
    });
  }

  function handleManualScanSubmit(event) {
    event.preventDefault();
    const rawValue = pickText(manualScanValue);
    if (!rawValue || processingScanRef.current) return;

    void ensureAudioFeedbackReady();
    void registerScan(rawValue);
    setManualScanValue("");
  }

  function handleToggleScanner() {
    if (showScanner) {
      void stopScanner();
      setShowScanner(false);
      return;
    }

    setShowScanner(true);
  }

  const guestBookRows = [...wishRecords].sort((left, right) => {
    const leftTime = new Date(left.createdAt || left.scannedAt || 0).getTime();
    const rightTime = new Date(right.createdAt || right.scannedAt || 0).getTime();
    return rightTime - leftTime;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8ef_0%,#f5ecdd_48%,#efe4d2_100%)] px-4 py-8 text-[#493521]">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/85 p-8 text-center shadow-[0_24px_80px_rgba(92,67,38,0.14)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9e7e57]">Buku Tamu</p>
          <h1 className="mt-3 font-['Playfair_Display'] text-4xl font-semibold">Memuat data tamu</h1>
          <p className="mt-3 text-sm text-[#83684a]">Menyiapkan daftar ucapan dan referensi tamu untuk undangan ini.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8ef_0%,#f5ecdd_48%,#efe4d2_100%)] px-4 py-8 text-[#493521]">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/90 p-8 text-center shadow-[0_24px_80px_rgba(92,67,38,0.14)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9e7e57]">Buku Tamu</p>
          <h1 className="mt-3 font-['Playfair_Display'] text-4xl font-semibold">Halaman belum tersedia</h1>
          <p className="mt-3 text-sm text-[#83684a]">{error}</p>
          {invitationSlug ? <p className="mt-4 text-xs uppercase tracking-[0.3em] text-[#b19472]">{invitationSlug}</p> : null}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={toAppPath(`/undangan/${encodeURIComponent(invitationSlug || "")}`)}
              className="inline-flex items-center gap-2 rounded-full border border-[#d9c4a8] bg-white px-5 py-3 text-sm font-semibold text-[#6f5535]"
            >
              Buka Undangan
            </a>
            <a
              href={toAppPath("/")}
              className="inline-flex items-center gap-2 rounded-full bg-[#7d5a39] px-5 py-3 text-sm font-semibold text-white"
            >
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff9f1_0%,#f5ecdd_48%,#ecdcc5_100%)] px-4 py-6 text-[#493521] sm:px-6 sm:py-8">
      {scanPopup ? (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md">
          <div className={`rounded-[1.4rem] border px-4 py-4 shadow-[0_18px_40px_rgba(56,39,20,0.18)] backdrop-blur ${getScanPopupClass(scanPopup.type)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{scanPopup.title}</p>
                <p className="mt-1 text-sm leading-6">{scanPopup.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setScanPopup(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-current/15 bg-white/60 text-base"
                aria-label="Tutup popup scan"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-lg border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(92,67,38,0.14)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] ${getPackageTagClass(packageTier)}`}>
                  {packageTier}
                </span>
                <span className="inline-flex rounded-full border border-[#ddc8ac] bg-white/80 px-3 py-1 text-xs font-semibold text-[#8a6b44]">
                  {pickText(invitationSlug, humanizeInvitationSlug(invitationSlug))}
                </span>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-[#9e7e57]">Buku Tamu</p>
              <h1 className="mt-2 font-['Playfair_Display'] text-4xl font-semibold text-[#4d3925] sm:text-5xl">{coupleLabel}</h1>
              
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={toAppPath(`/undangan/${encodeURIComponent(invitationSlug || "")}`)}
                className="inline-flex items-center gap-2 rounded-full border border-[#d9c4a8] bg-white px-5 py-3 text-sm font-semibold text-[#6f5535]"
              >
                Buka Undangan
              </a>
              <button
                type="button"
                onClick={() => loadGuestBook({ silent: true })}
                className="inline-flex items-center gap-2 rounded-full bg-[#7d5a39] px-5 py-3 text-sm font-semibold text-white"
              >
                {refreshing ? "Memuat ulang..." : "Refresh Data"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(92,67,38,0.12)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9e7e57]">Tamu</p>
              <h2 className="mt-2 font-['Playfair_Display'] text-3xl font-semibold text-[#4d3925]">Daftar Buku Tamu</h2>
              <p className="mt-2 text-sm text-[#7d6447]">Total data: {guestBookRows.length}</p>
            </div>

            {qrModeEnabled ? (
              <button
                type="button"
                onClick={handleToggleScanner}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                {showScanner ? "Tutup Scan QR" : "Scan QR Tamu"}
              </button>
            ) : null}
          </div>

          {qrModeEnabled && showScanner ? (
            <div className="mt-6 rounded-lg border border-[#eadcc8] bg-[#fffaf3] p-4 sm:p-5">
              <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9e7e57]">Scanner Kamera</p>
                  <div className="mt-3 overflow-hidden rounded-[1.4rem] border border-[#eadcc8] bg-[#1e1a17]">
                    <div className="relative aspect-[4/3] w-full bg-[radial-gradient(circle_at_top,#5d4731_0%,#231b15_65%,#120d0a_100%)]">
                      <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                      <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(9,7,6,0.85))] px-4 py-3 text-center text-white">
                        <p className="text-xs uppercase tracking-[0.28em] text-[#ecd1ab]">
                          {scannerState === "active" ? "Kamera aktif" : scannerState === "starting" ? "Membuka kamera..." : "Scanner siaga"}
                        </p>
                        <p className="mt-2 text-sm text-white/80">
                          {scannerMessage || (canUseCameraScan ? "Arahkan QR tamu ke kamera." : "Browser belum mendukung scan otomatis.")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {scannerState === "active" ? (
                      <button
                        type="button"
                        onClick={() => void stopScanner("idle")}
                        className="inline-flex items-center gap-2 rounded-full bg-[#7d5a39] px-5 py-3 text-sm font-semibold text-white"
                      >
                        Stop Scanner
                      </button>
                    ) : scannerState === "processing" ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-2 rounded-full bg-[#bda384] px-5 py-3 text-sm font-semibold text-white/90"
                      >
                        Memproses...
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startScanner}
                        className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#7d5a39] px-5 py-3 text-sm font-semibold text-white"
                      >
                        {scanHistory.length ? "Scan Lagi" : "Klik Mulai Scan"}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9e7e57]">Input Manual</p>
                  <form onSubmit={handleManualScanSubmit} className="mt-3 space-y-3">
                    <textarea
                      value={manualScanValue}
                      onChange={(event) => setManualScanValue(event.target.value)}
                      rows={4}
                      placeholder="Tempel isi QR code di sini jika diperlukan."
                      className="w-full rounded-md border border-[#e6d4bd] bg-white px-4 py-3 text-sm text-[#5b432b] outline-none transition focus:border-[#c89d62] focus:ring-2 focus:ring-[#f2e0c8]"
                    />
                    <div className="w-full text-center">
                      <button
                        type="submit"
                        className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#d9c4a8] bg-white px-5 py-3 text-sm font-semibold text-[#6f5535]"
                      >
                        Proses QR
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-md border border-[#eadcc8]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#eadcc8]">
                <thead className="bg-[#f7efe3]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6b44]">No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6b44]">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6b44]">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1e4d4] bg-white">
                  {guestBookRows.length ? (
                    guestBookRows.map((wish, index) => (
                      <tr key={wish.wishId} className="align-top">
                        <td className="px-4 py-4 text-sm font-medium text-[#5c4329]">{index + 1}</td>
                        <td className="px-4 py-4 text-sm text-[#5c4329]">
                          <p className="font-semibold">{wish.name}</p>
                          {wish.createdAt ? (
                            <p className="mt-1 text-xs text-[#8d7150]">{formatDateTime(wish.createdAt)}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-sm text-[#5c4329]">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getAttendanceBadgeClass(wish.attendance)}`}>
                            {formatAttendanceLabel(wish.attendance)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-sm text-[#8a6b44]">
                        Belum ada data buku tamu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
