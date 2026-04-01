import { useEffect, useRef, useState } from "react";
import { getPackageConfig, normalizePackageTier } from "../data/packageCatalog";
import { fetchInvitationBySlug, fetchInvitationWishListBySlug } from "../services/invitationApi";
import { postInvitationWish } from "../services/wishesApi";
import { getInvitationSlugFromPath, toAppPath } from "../utils/navigation";
import { readGuestQueryParams } from "../utils/guestParams";
import {
  humanizeInvitationSlug,
  isInvitationPubliclyAccessible,
  pickText,
  resolveInvitationCoupleLabel,
  resolveInvitationPackageTier,
} from "../utils/invitationMetadata";

const SCAN_STORAGE_PREFIX = "ikc_guestbook_scan_history_v1:";

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

function getScanBadgeClass(status) {
  if (status === "matched") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "duplicate") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-rose-100 text-rose-700 border-rose-200";
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

export default function InvitationGuestBookPage() {
  const invitationSlug = getInvitationSlugFromPath();
  const [invitationData, setInvitationData] = useState(null);
  const [wishRecords, setWishRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [scanHistory, setScanHistory] = useState([]);
  const [manualScanValue, setManualScanValue] = useState("");
  const [scannerState, setScannerState] = useState("idle");
  const [scannerMessage, setScannerMessage] = useState("");
  const [lastScanEntry, setLastScanEntry] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRequestRef = useRef(0);
  const lastDetectedRef = useRef({ value: "", at: 0 });
  const pendingGuestKeysRef = useRef(new Set());

  const packageTier = normalizePackageTier(resolveInvitationPackageTier(invitationData));
  const packageConfig = getPackageConfig(packageTier);
  const coupleLabel = resolveInvitationCoupleLabel(invitationData, invitationSlug);
  const qrModeEnabled = packageTier === "EKSKLUSIF";
  const guestBookEnabled = packageConfig?.capabilities?.guestBook === true;
  const canUseCameraScan =
    typeof window !== "undefined" &&
    "BarcodeDetector" in window &&
    Boolean(navigator?.mediaDevices?.getUserMedia);

  async function stopScanner() {
    if (frameRequestRef.current) {
      window.cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = 0;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScannerState("idle");
  }

  async function loadGuestBook({ silent = false } = {}) {
    if (!invitationSlug) {
      setInvitationData(null);
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
      const [nextInvitationData, nextWishPayload] = await Promise.all([
        fetchInvitationBySlug(invitationSlug),
        fetchInvitationWishListBySlug(invitationSlug),
      ]);

      if (!isInvitationPubliclyAccessible(nextInvitationData)) {
        setInvitationData(null);
        setWishRecords([]);
        setError("Undangan ini masih diproses atau belum dipublikasikan.");
        return;
      }

      const normalizedWishes = (Array.isArray(nextWishPayload?.wishes) ? nextWishPayload.wishes : []).map((record, index) =>
        normalizeWishRecord(record, index, invitationSlug, nextWishPayload?.orderId || null)
      );

      normalizedWishes.sort((left, right) => {
        const leftTime = new Date(left.createdAt || 0).getTime();
        const rightTime = new Date(right.createdAt || 0).getTime();
        return rightTime - leftTime;
      });

      setInvitationData(nextInvitationData || null);
      setWishRecords(normalizedWishes);
    } catch (err) {
      setInvitationData(null);
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
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationSlug]);

  useEffect(() => {
    setScanHistory(readScanHistory(invitationSlug));
  }, [invitationSlug]);

  useEffect(() => {
    writeScanHistory(invitationSlug, scanHistory);
  }, [invitationSlug, scanHistory]);

  useEffect(() => {
    if (!qrModeEnabled || scannerState !== "active" || !canUseCameraScan) {
      return undefined;
    }

    let disposed = false;
    let detector = null;

    async function scanFrame() {
      if (disposed) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && detector) {
        try {
          const barcodes = await detector.detect(video);
          const rawValue = pickText(barcodes?.[0]?.rawValue);

          if (rawValue) {
            const now = Date.now();
            const lastDetected = lastDetectedRef.current;

            if (lastDetected.value !== rawValue || now - lastDetected.at > 2500) {
              lastDetectedRef.current = { value: rawValue, at: now };
              void registerScan(rawValue);
            }
          }
        } catch (err) {
          setScannerMessage(err?.message || "Proses scan QR tidak tersedia di browser ini.");
        }
      }

      frameRequestRef.current = window.requestAnimationFrame(scanFrame);
    }

    try {
      const DetectorClass = window.BarcodeDetector;
      detector = new DetectorClass({ formats: ["qr_code"] });
      frameRequestRef.current = window.requestAnimationFrame(scanFrame);
    } catch (err) {
      setScannerMessage(err?.message || "Barcode detector tidak tersedia.");
      stopScanner();
    }

    return () => {
      disposed = true;
      if (frameRequestRef.current) {
        window.cancelAnimationFrame(frameRequestRef.current);
        frameRequestRef.current = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrModeEnabled, scannerState, canUseCameraScan, wishRecords]);

  async function startScanner() {
    if (!qrModeEnabled) return;

    if (!canUseCameraScan) {
      setScannerMessage("Browser ini belum mendukung scan QR otomatis. Gunakan input manual di bawah.");
      return;
    }

    try {
      setScannerMessage("");
      setScannerState("starting");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScannerState("active");
    } catch (err) {
      setScannerState("idle");
      setScannerMessage(err?.message || "Akses kamera ditolak atau tidak tersedia.");
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
        setWishRecords((current) => {
          const nextRecords = [createdRecord, ...current];
          nextRecords.sort((left, right) => {
            const leftTime = new Date(left.createdAt || 0).getTime();
            const rightTime = new Date(right.createdAt || 0).getTime();
            return rightTime - leftTime;
          });
          return nextRecords;
        });
        setScannerMessage("Kehadiran QR berhasil disimpan.");
        void loadGuestBook({ silent: true });
      } catch (err) {
        status = "unmatched";
        matchedRecordId = null;
        matchedAttendance = "";
        setScannerMessage(err?.message || "Gagal menyimpan kehadiran QR ke backend.");
      } finally {
        pendingGuestKeysRef.current.delete(pendingGuestKey);
      }
    }

    setScanHistory((current) => {
      const rawDuplicate = !hasMatch ? current.some((entry) => entry.rawValue === rawValue) : false;
      const nextEntry = createScanEntry(rawValue, {
        status: rawDuplicate ? "duplicate" : status,
        matchedRecordId,
        matchedName,
        matchedAttendance,
      });
      setLastScanEntry(nextEntry);
      return [nextEntry, ...current].slice(0, 25);
    });
  }

  function handleManualScanSubmit(event) {
    event.preventDefault();
    const rawValue = pickText(manualScanValue);
    if (!rawValue) return;

    void registerScan(rawValue);
    setManualScanValue("");
  }

  function handleToggleScanner() {
    if (showScanner) {
      stopScanner();
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

  if (!guestBookEnabled) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8ef_0%,#f5ecdd_48%,#efe4d2_100%)] px-4 py-8 text-[#493521]">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/90 p-8 text-center shadow-[0_24px_80px_rgba(92,67,38,0.14)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9e7e57]">Buku Tamu</p>
          <h1 className="mt-3 font-['Playfair_Display'] text-4xl font-semibold">Fitur tidak tersedia</h1>
          <p className="mt-3 text-sm text-[#83684a]">
            Buku tamu hanya aktif untuk paket Premium dan Eksklusif. Undangan ini terdeteksi sebagai paket {packageTier || "BASIC"}.
          </p>
          <div className="mt-6">
            <a
              href={toAppPath(`/undangan/${encodeURIComponent(invitationSlug || "")}`)}
              className="inline-flex items-center gap-2 rounded-full bg-[#7d5a39] px-5 py-3 text-sm font-semibold text-white"
            >
              Kembali ke Undangan
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff9f1_0%,#f5ecdd_48%,#ecdcc5_100%)] px-4 py-6 text-[#493521] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(92,67,38,0.14)] backdrop-blur sm:p-8">
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

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(92,67,38,0.12)] sm:p-8">
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
            <div className="mt-6 rounded-[1.6rem] border border-[#eadcc8] bg-[#fffaf3] p-4 sm:p-5">
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
                        onClick={stopScanner}
                        className="inline-flex items-center gap-2 rounded-full bg-[#7d5a39] px-5 py-3 text-sm font-semibold text-white"
                      >
                        Stop Scanner
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startScanner}
                        className="inline-flex items-center gap-2 rounded-full bg-[#7d5a39] px-5 py-3 text-sm font-semibold text-white"
                      >
                        Mulai Scan
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
                      className="w-full rounded-2xl border border-[#e6d4bd] bg-white px-4 py-3 text-sm text-[#5b432b] outline-none transition focus:border-[#c89d62] focus:ring-2 focus:ring-[#f2e0c8]"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full border border-[#d9c4a8] bg-white px-5 py-3 text-sm font-semibold text-[#6f5535]"
                    >
                      Proses QR
                    </button>
                  </form>

                  <div className="mt-5 rounded-[1.4rem] border border-[#eadcc8] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9e7e57]">Hasil Scan Terakhir</p>
                    {lastScanEntry ? (
                      <div className="mt-3 space-y-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getScanBadgeClass(lastScanEntry.status)}`}>
                          {lastScanEntry.status === "matched"
                            ? "Scan valid"
                            : lastScanEntry.status === "duplicate"
                              ? "Duplikat"
                              : "Tidak cocok"}
                        </span>
                        <p className="text-sm font-semibold text-[#5c4329]">
                          {lastScanEntry.matchedName || "QR belum cocok dengan data tamu"}
                        </p>
                        <p className="text-sm text-[#7d6447]">
                          {lastScanEntry.matchedAttendance
                            ? `Attendance: ${formatAttendanceLabel(lastScanEntry.matchedAttendance)}`
                            : "Belum ada attendance yang cocok."}
                        </p>
                        <p className="text-xs text-[#8d7150]">{formatDateTime(lastScanEntry.scannedAt)}</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[#7d6447]">Belum ada scan pada sesi ini.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-[#eadcc8]">
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
