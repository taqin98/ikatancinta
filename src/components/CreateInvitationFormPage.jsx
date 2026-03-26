import { useEffect, useMemo, useRef, useState } from "react";
import { buildOrderConfirmationPath, navigateTo, toAppPath } from "../utils/navigation";
import { getPackageConfig, normalizePackageTier } from "../data/packageCatalog";
import { QUOTE_CATEGORIES, QUOTE_PRESETS } from "../data/Quotes";
import { MUSIC_TRACKS } from "../data/musicTracks";
import { getThemeUploadConfig } from "../data/themeFormRules";
import { useThemeCatalog } from "../hooks/useCatalogData";
import { ORDER_CONFIRMATION_STORAGE_KEY } from "../services/dummyOrderApi";
import { submitOrder } from "../services/orderApi";
import { saveInvitationDraft, mapFormToInvitationSchema } from "../services/invitationDataBridge";
import { uploadOrderAsset } from "../services/uploadApi";
import { getDefaultSchemaBySlug } from "../templates/basic/schemas";
import { createOrderId } from "../utils/orderId";

const INITIAL_CUSTOMER = { name: "", phone: "", email: "", address: "" };
const INITIAL_GROOM = { fullname: "", nickname: "", parents: "", instagram: "", photo: null };
const INITIAL_BRIDE = { fullname: "", nickname: "", parents: "", instagram: "", photo: null };
const INITIAL_AKAD = { date: "", startTime: "", endTime: "", venue: "", address: "", mapsLink: "", coverImage: null };
const INITIAL_RESEPSI = { date: "", startTime: "", endTime: "", venue: "", address: "", mapsLink: "", coverImage: null };
const INITIAL_GIFT_BANK = { bank: "", account: "", name: "" };
const INITIAL_GIFT_BANKS = [INITIAL_GIFT_BANK, INITIAL_GIFT_BANK].map((item) => ({ ...item }));
const INITIAL_GIFT_SHIPPING = { recipient: "", phone: "", address: "" };
const INITIAL_SESSIONS = [
  { id: 1, start: "10:00", end: "11:00" },
  { id: 2, start: "11:30", end: "12:30" },
];
const INITIAL_STORIES = [
  { id: 1, title: "Pertama Bertemu", description: "Kami bertemu pertama kali di acara kampus dan mulai saling mengenal.", date: "2019", photo: null },
  { id: 2, title: "Menjalin Asmara", description: "Setelah berteman lama, kami memutuskan melangkah lebih serius.", date: "2021", photo: null },
];

function StepItem({ index, label, currentStep }) {
  const isActive = currentStep === index;
  const isDone = currentStep > index;

  return (
    <div className="flex flex-col items-center gap-1.5 z-10 relative min-w-0">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold border-2 transition-all ${isActive || isDone
          ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
          : "bg-white border-slate-200 dark:border-slate-600 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
          }`}
      >
        {isDone ? <span className="material-symbols-outlined text-[15px]">check</span> : index}
      </div>
      <span className={`text-[10px] ${isActive ? "font-bold text-primary" : "font-medium text-slate-400 dark:text-slate-500"}`}>
        {label}
      </span>
    </div>
  );
}

function normalizeGiftBankList(bankList = []) {
  return bankList
    .map((item) => ({
      bank: String(item?.bank || "").trim(),
      account: String(item?.account || "").trim(),
      name: String(item?.name || "").trim(),
    }))
    .filter((item) => item.bank || item.account || item.name);
}

function normalizeGiftShipping(shipping = {}) {
  return {
    recipient: String(shipping?.recipient || "").trim(),
    phone: String(shipping?.phone || "").trim(),
    address: String(shipping?.address || "").trim(),
  };
}

function hasGiftContent(bankList = [], shipping = {}) {
  const normalizedBankList = normalizeGiftBankList(bankList);
  const normalizedShipping = normalizeGiftShipping(shipping);
  return (
    normalizedBankList.length > 0 ||
    Boolean(normalizedShipping.recipient || normalizedShipping.phone || normalizedShipping.address)
  );
}

function formatDateID(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMoneyID(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatSessionsSummary(sessions) {
  return (sessions || [])
    .filter((session) => session.start && session.end)
    .map((session, index) => `Sesi ${index + 1}: ${session.start} - ${session.end} WIB`)
    .join(" • ");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
}

function isValidPhoneNumber(value) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return false;
  const isLocal = digits.startsWith("0") && digits.length >= 10 && digits.length <= 15;
  const isIntl = digits.startsWith("62") && digits.length >= 11 && digits.length <= 15;
  return isLocal || isIntl;
}

function toMinutes(timeValue) {
  if (!timeValue || !timeValue.includes(":")) return null;
  const [hh, mm] = timeValue.split(":").map((part) => Number(part));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function isEndTimeAfterStart(start, end) {
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  if (startMinutes === null || endMinutes === null) return false;
  return endMinutes > startMinutes;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function inferMimeTypeFromDataUrl(dataUrl, fallback = "application/octet-stream") {
  if (typeof dataUrl !== "string") return fallback;
  const match = dataUrl.match(/^data:([^;]+);base64,/i);
  return match?.[1] || fallback;
}

function createLocalImageAsset(file, dataUrl) {
  return {
    id: Date.now() + Math.random(),
    name: file.name,
    size: file.size,
    sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    url: dataUrl,
  };
}

function extractFilesFromDropEvent(event) {
  return Array.from(event?.dataTransfer?.files || []);
}

function createSyntheticFileChangeEvent(files) {
  const normalizedFiles = Array.from(files || []);
  return {
    target: { files: normalizedFiles, value: "" },
    currentTarget: { files: normalizedFiles, value: "" },
  };
}

function uploadOptionalImageAsset(orderId, image, kind) {
  if (!image) return Promise.resolve(null);

  return uploadOrderAsset({
    orderId,
    kind,
    name: image.name,
    size: image.size,
    mimeType: inferMimeTypeFromDataUrl(image.url, "image/jpeg"),
    dataUrl: image.url,
  });
}

async function prepareOrderAssetsForSubmission({
  orderId,
  frontCoverImage,
  coverImage,
  openingThumbnailImage,
  groomPhoto,
  bridePhoto,
  akadCoverImage,
  resepsiCoverImage,
  saveTheDateBackgroundImage,
  wishesBackgroundImage,
  closingBackgroundImage,
  galleryImages,
  stories,
  musicMode,
  uploadedMusicFile,
}) {
  const uploadedFrontCover = await uploadOptionalImageAsset(orderId, frontCoverImage, "front-cover");
  const uploadedCover = await uploadOptionalImageAsset(orderId, coverImage, "cover");
  const uploadedOpeningThumbnail = await uploadOptionalImageAsset(orderId, openingThumbnailImage, "opening-thumbnail");
  const uploadedGroomPhoto = await uploadOptionalImageAsset(orderId, groomPhoto, "groom-photo");
  const uploadedBridePhoto = await uploadOptionalImageAsset(orderId, bridePhoto, "bride-photo");
  const uploadedAkadCover = await uploadOptionalImageAsset(orderId, akadCoverImage, "akad-cover");
  const uploadedResepsiCover = await uploadOptionalImageAsset(orderId, resepsiCoverImage, "resepsi-cover");
  const uploadedSaveTheDateBackground = await uploadOptionalImageAsset(orderId, saveTheDateBackgroundImage, "save-the-date-background");
  const uploadedWishesBackground = await uploadOptionalImageAsset(orderId, wishesBackgroundImage, "wishes-background");
  const uploadedClosingBackground = await uploadOptionalImageAsset(orderId, closingBackgroundImage, "closing-background");

  const uploadedGallery = [];
  for (const image of galleryImages || []) {
    uploadedGallery.push(
      await uploadOrderAsset({
        orderId,
        kind: "gallery",
        name: image.name,
        size: image.size,
        mimeType: inferMimeTypeFromDataUrl(image.url, "image/jpeg"),
        dataUrl: image.url,
      }),
    );
  }

  const uploadedStories = [];
  for (const [index, story] of Array.from(stories || []).entries()) {
    const uploadedPhoto = story?.photo
      ? await uploadOptionalImageAsset(orderId, story.photo, `love-story-photo-${index + 1}`)
      : null;

    uploadedStories.push({
      ...story,
      photo: uploadedPhoto,
    });
  }

  const uploadedMusic =
    musicMode === "upload" && uploadedMusicFile
      ? await uploadOrderAsset({
        orderId,
        kind: "music",
        name: uploadedMusicFile.name,
        size: uploadedMusicFile.size,
        mimeType: uploadedMusicFile.type || inferMimeTypeFromDataUrl(uploadedMusicFile.dataUrl, "audio/mpeg"),
        dataUrl: uploadedMusicFile.dataUrl,
      })
      : null;

  return {
    uploadedFrontCover,
    uploadedCover,
    uploadedOpeningThumbnail,
    uploadedGroomPhoto,
    uploadedBridePhoto,
    uploadedAkadCover,
    uploadedResepsiCover,
    uploadedSaveTheDateBackground,
    uploadedWishesBackground,
    uploadedClosingBackground,
    uploadedGallery,
    uploadedStories,
    uploadedMusic,
  };
}

function resolveInitialTheme(themesList) {
  const params = new URLSearchParams(window.location.search);
  const themeSlug = params.get("theme");
  const presetId = params.get("preset_id");
  const packageTier = normalizePackageTier(params.get("package"));

  if (themeSlug) {
    const bySlug = themesList.find((theme) => theme.slug === themeSlug);
    if (bySlug) return bySlug;
  }
  if (presetId) {
    const byPreset = themesList.find((theme) => theme.presetId === presetId);
    if (byPreset) return byPreset;
  }
  if (packageTier) {
    const byPackage = themesList.find((theme) => theme.packageTier === packageTier);
    if (byPackage) return byPackage;
  }

  return themesList.find((theme) => theme.packageTier === "BASIC") || themesList[0] || null;
}

function usesSingleCoverFlow(uploadConfig) {
  return Boolean(uploadConfig?.frontCover?.visible && !uploadConfig?.cover?.visible);
}

function StepOneMempelai({
  customer,
  setCustomer,
  groom,
  setGroom,
  bride,
  setBride,
  selectedTheme,
  availableThemes,
  onSelectTheme,
}) {
  const handleInput = (setter, key) => (event) => setter((prev) => ({ ...prev, [key]: event.target.value }));
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [themeQuery, setThemeQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const filteredThemes = useMemo(() => {
    const keyword = themeQuery.trim().toLowerCase();
    if (!keyword) {
      return availableThemes;
    }

    return availableThemes.filter((theme) =>
      [theme.name, theme.category, theme.packageTier].join(" ").toLowerCase().includes(keyword)
    );
  }, [availableThemes, themeQuery]);
  const sortedThemes = useMemo(() => {
    const list = [...filteredThemes];
    const originalOrder = new Map(availableThemes.map((theme, index) => [theme.slug, index]));
    const rankBySort = {
      popular: { BASIC: 0, PREMIUM: 1, EKSKLUSIF: 2 },
      basic: { BASIC: 0, PREMIUM: 1, EKSKLUSIF: 2 },
      premium: { PREMIUM: 0, BASIC: 1, EKSKLUSIF: 2 },
    };
    const rank = rankBySort[sortBy];
    if (!rank) {
      return list;
    }

    list.sort((a, b) => {
      const rankDiff = (rank[a.packageTier] ?? 99) - (rank[b.packageTier] ?? 99);
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return (originalOrder.get(a.slug) ?? 999) - (originalOrder.get(b.slug) ?? 999);
    });
    return list;
  }, [availableThemes, filteredThemes, sortBy]);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Data Mempelai</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Lengkapi data diri kamu dan pasangan untuk ditampilkan di undangan digitalmu.</p>
      </div>

      <section className="mb-6 sticky top-2 z-20 rounded-lg border border-primary/15  backdrop-blur p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Tema Dipilih</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {selectedTheme?.name} <span className="text-xs text-slate-500">({selectedTheme?.packageTier})</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsThemePickerOpen((prev) => !prev)}
            className="text-xs font-bold px-3 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary transition-colors"
          >
            {isThemePickerOpen ? "Tutup Pilihan Tema" : "Pilih Tema Lain"}
          </button>
        </div>

        {isThemePickerOpen && (
          <div className="mt-4">
            <div className="mb-3 grid grid-cols-1 sm:grid-cols-[1fr,180px] gap-2">
              <input
                type="text"
                value={themeQuery}
                onChange={(event) => setThemeQuery(event.target.value)}
                placeholder="Cari nama tema, kategori, atau paket..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm focus:border-primary focus:ring-primary"
              />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm focus:border-primary focus:ring-primary"
              >
                <option value="popular">Populer Dulu</option>
                <option value="basic">Basic Dulu</option>
                <option value="premium">Premium Dulu</option>
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sortedThemes.map((theme) => (
                <button
                  type="button"
                  key={theme.slug}
                  onClick={() => {
                    onSelectTheme(theme);
                    setIsThemePickerOpen(false);
                    setThemeQuery("");
                  }}
                  className={`text-left rounded-xl border p-2 transition-colors ${selectedTheme?.slug === theme.slug
                    ? "border-primary bg-white shadow-sm ring-2 ring-primary/30"
                    : "border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-800 hover:border-primary/60"
                    }`}
                >
                  <div className="relative w-full aspect-[4/6] rounded-lg overflow-hidden bg-slate-200 mb-2">
                    <img src={theme.thumbnail || theme.image} alt={`Thumbnail ${theme.name}`} className="w-full h-full object-cover" />
                    {selectedTheme?.slug === theme.slug && (
                      <>
                        <div className="absolute inset-0 ring-2 ring-primary/80 rounded-lg"></div>
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 rounded-lg bg-primary text-white text-[10px] font-bold px-1.5 py-0.5">
                          Tema Aktif
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">{theme.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-300">{theme.packageTier}</p>
                </button>
              ))}
            </div>

            {sortedThemes.length === 0 && (
              <div className="mt-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 py-4 text-center text-xs text-slate-500 dark:text-slate-300">
                Tema tidak ditemukan. Coba kata kunci lain.
              </div>
            )}
          </div>
        )}
      </section>

      <form className="grid grid-cols-1 2xl:grid-cols-2 gap-8" onSubmit={(e) => e.preventDefault()}>
        <section className="relative bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 2xl:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Info Customer</h3>
              <p className="text-xs text-slate-500">Data pemesan undangan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1" htmlFor="customer_name">Nama</label>
              <input id="customer_name" type="text" value={customer.name} onChange={handleInput(setCustomer, "name")} placeholder="Contoh: Anisa Putri" className="w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1" htmlFor="customer_phone">No HP / WA</label>
              <input
                id="customer_phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={customer.phone}
                onChange={handleInput(setCustomer, "phone")}
                placeholder="Contoh: 08567452717"
                className="w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
              />
              <p className="mt-1 ml-1 text-[11px] text-slate-500 dark:text-slate-400">Gunakan format `08xxxxxxxxxx` atau `62xxxxxxxxxx`.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1" htmlFor="customer_email">Email</label>
              <input
                id="customer_email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={customer.email}
                onChange={handleInput(setCustomer, "email")}
                placeholder="Contoh: anisa@email.com"
                className="w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
              />
              <p className="mt-1 ml-1 text-[11px] text-slate-500 dark:text-slate-400">Contoh format: `nama@email.com`.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1" htmlFor="customer_address">Alamat (Opsional)</label>
              <input id="customer_address" type="text" value={customer.address} onChange={handleInput(setCustomer, "address")} placeholder="Contoh: Jakarta Selatan" className="w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900" />
            </div>
          </div>
        </section>

        <section className="relative bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><span className="material-symbols-outlined">male</span></div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Mempelai Pria</h3>
              <p className="text-xs text-slate-500">Data pengantin laki-laki</p>
            </div>
          </div>
          <div className="space-y-4">
            <input id="groom_fullname" type="text" value={groom.fullname} onChange={handleInput(setGroom, "fullname")} placeholder="Nama Lengkap" className="w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900" />
            <input type="text" value={groom.nickname} onChange={handleInput(setGroom, "nickname")} placeholder="Nama Panggilan" className="w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900" />
            <textarea rows={2} value={groom.parents} onChange={handleInput(setGroom, "parents")} placeholder="Nama Ayah & Ibu" className="w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900" />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</span>
              <input type="text" value={groom.instagram} onChange={handleInput(setGroom, "instagram")} placeholder="instagram" className="w-full rounded-lg border-slate-200 bg-slate-50 pl-8 pr-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900" />
            </div>
          </div>
        </section>

        <section className="relative bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-pink-500 dark:bg-pink-900/30 dark:text-pink-400"><span className="material-symbols-outlined">female</span></div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Mempelai Wanita</h3>
              <p className="text-xs text-slate-500">Data pengantin perempuan</p>
            </div>
          </div>
          <div className="space-y-4">
            <input id="bride_fullname" type="text" value={bride.fullname} onChange={handleInput(setBride, "fullname")} placeholder="Nama Lengkap" className="w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900" />
            <input type="text" value={bride.nickname} onChange={handleInput(setBride, "nickname")} placeholder="Nama Panggilan" className="w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900" />
            <textarea rows={2} value={bride.parents} onChange={handleInput(setBride, "parents")} placeholder="Nama Ayah & Ibu" className="w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900" />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</span>
              <input type="text" value={bride.instagram} onChange={handleInput(setBride, "instagram")} placeholder="instagram" className="w-full rounded-lg border-slate-200 bg-slate-50 pl-8 pr-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900" />
            </div>
          </div>
        </section>
      </form>
    </>
  );
}

function StepTwoAcara({
  akad,
  setAkad,
  resepsi,
  setResepsi,
  isSessionEnabled,
  setIsSessionEnabled,
  sessions,
  addSession,
  removeSession,
  updateSession,
  packageConfig,
  giftBankList,
  setGiftBankList,
  giftShipping,
  setGiftShipping,
}) {
  const handleAkad = (key) => (e) => setAkad((prev) => ({ ...prev, [key]: e.target.value }));
  const handleResepsi = (key) => (e) => setResepsi((prev) => ({ ...prev, [key]: e.target.value }));
  const canUseDigitalEnvelope = packageConfig?.capabilities?.digitalEnvelope === true;
  const handleGiftBank = (index, key) => (e) => {
    const nextValue = e.target.value;
    setGiftBankList((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: nextValue } : item)));
  };
  const handleGiftShipping = (key) => (e) => setGiftShipping((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Detail Acara</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Isi jadwal akad dan resepsi. Resepsi selalu aktif, dan sesi tamu bisa diaktifkan bila diperlukan.</p>
      </div>

      <section className="mb-8 space-y-5 rounded-lg border border-slate-100 dark:border-slate-800 p-5 bg-white dark:bg-slate-800/40">
        <h3 className="text-xl font-bold">Akad Nikah</h3>
        <input id="akad_date" className="w-full bg-surface-light dark:bg-white/5 rounded-lg h-14 px-4" type="date" value={akad.date} onChange={handleAkad("date")} />
        <div className="grid grid-cols-2 gap-4">
          <input id="akad_start_time" className="w-full bg-surface-light dark:bg-white/5 rounded-lg h-14 px-4" type="time" value={akad.startTime} onChange={handleAkad("startTime")} />
          <input id="akad_end_time" className="w-full bg-surface-light dark:bg-white/5 rounded-lg h-14 px-4" type="time" value={akad.endTime} onChange={handleAkad("endTime")} />
        </div>
        <input id="akad_venue" className="w-full bg-surface-light dark:bg-white/5 rounded-lg h-14 px-4" placeholder="Tempat / Nama Lokasi" type="text" value={akad.venue} onChange={handleAkad("venue")} />
        <textarea className="w-full bg-surface-light dark:bg-white/5 rounded-lg p-4 resize-none" rows={3} placeholder="Alamat Lengkap" value={akad.address} onChange={handleAkad("address")} />
        <input className="w-full bg-surface-light dark:bg-white/5 rounded-lg h-14 px-4" placeholder="Link Google Maps" type="url" value={akad.mapsLink} onChange={handleAkad("mapsLink")} />
      </section>

      <section className="mb-8 space-y-5 rounded-lg border border-slate-100 dark:border-slate-800 p-5 bg-white dark:bg-slate-800/40">
        <h3 className="text-xl font-bold">Resepsi</h3>
        <input id="resepsi_date" className="w-full bg-surface-light dark:bg-white/5 rounded-lg h-14 px-4" type="date" value={resepsi.date} onChange={handleResepsi("date")} />
        <div className="grid grid-cols-2 gap-4">
          <input id="resepsi_start_time" className="w-full bg-surface-light dark:bg-white/5 rounded-lg h-14 px-4" type="time" value={resepsi.startTime} onChange={handleResepsi("startTime")} />
          <input id="resepsi_end_time" className="w-full bg-surface-light dark:bg-white/5 rounded-lg h-14 px-4" type="time" value={resepsi.endTime} onChange={handleResepsi("endTime")} />
        </div>
        <input id="resepsi_venue" className="w-full bg-surface-light dark:bg-white/5 rounded-lg h-14 px-4" placeholder="Tempat / Nama Lokasi" type="text" value={resepsi.venue} onChange={handleResepsi("venue")} />
        <textarea className="w-full bg-surface-light dark:bg-white/5 rounded-lg p-4 resize-none" rows={3} placeholder="Alamat Lengkap" value={resepsi.address} onChange={handleResepsi("address")} />

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-base font-bold">Tambah Pembagian Sesi?</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Aktifkan jika tamu resepsi dibagi ke beberapa jam kehadiran.</p>
          </div>
          <button type="button" onClick={() => setIsSessionEnabled((prev) => !prev)} className={`relative h-8 w-14 rounded-full transition-colors ${isSessionEnabled ? "bg-primary" : "bg-slate-200 dark:bg-white/20"}`}>
            <span className={`absolute left-[2px] top-[2px] h-7 w-7 rounded-full bg-white border border-slate-300 transition-transform duration-300 ${isSessionEnabled ? "translate-x-6" : "translate-x-0"}`}></span>
          </button>
        </div>

        {isSessionEnabled && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <p className="text-sm font-semibold">Pembagian Sesi</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Data sesi ini nantinya tampil sebagai teks di bawah informasi resepsi.</p>
              </div>
              <button type="button" onClick={addSession} className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">add</span>
                Tambah Sesi
              </button>
            </div>

            <div className="space-y-3">
              {sessions.map((session, idx) => (
                <div key={session.id} className="bg-surface-light dark:bg-white/5 rounded-lg p-4 border border-slate-100 dark:border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold">Sesi {idx + 1}</span>
                    {idx > 0 && (
                      <button type="button" onClick={() => removeSession(session.id)} className="text-slate-400 hover:text-red-500">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg h-10 px-3 text-sm" type="time" value={session.start} onChange={(e) => updateSession(session.id, "start", e.target.value)} data-session-field={`start-${session.id}`} />
                    <input className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg h-10 px-3 text-sm" type="time" value={session.end} onChange={(e) => updateSession(session.id, "end", e.target.value)} data-session-field={`end-${session.id}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mb-8 space-y-5 rounded-lg border border-slate-100 dark:border-slate-800 p-5 bg-white dark:bg-slate-800/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">Wedding Gift / Amplop Digital</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Atur rekening atau e-wallet yang ingin ditampilkan pada section gift.</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${canUseDigitalEnvelope ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>
            {canUseDigitalEnvelope ? "Aktif di paket ini" : "Tidak aktif di paket ini"}
          </span>
        </div>

        {!canUseDigitalEnvelope && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Amplop digital tersedia mulai paket PREMIUM.
          </div>
        )}

        {canUseDigitalEnvelope && (
          <>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {giftBankList.map((bank, index) => (
                <div key={`gift-bank-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/30">
                  <p className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">Rekening / E-Wallet {index + 1}</p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={bank.bank}
                      onChange={handleGiftBank(index, "bank")}
                      placeholder="Contoh: BCA, Mandiri, BRI, DANA"
                      className="w-full rounded-lg border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      type="text"
                      value={bank.account}
                      onChange={handleGiftBank(index, "account")}
                      placeholder="Nomor rekening / nomor e-wallet"
                      className="w-full rounded-lg border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      type="text"
                      value={bank.name}
                      onChange={handleGiftBank(index, "name")}
                      placeholder="Nama pemilik rekening"
                      className="w-full rounded-lg border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/30">
              <p className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">Alamat Pengiriman Hadiah</p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={giftShipping.recipient}
                  onChange={handleGiftShipping("recipient")}
                  placeholder="Nama penerima"
                  className="w-full rounded-lg border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
                />
                <input
                  type="tel"
                  value={giftShipping.phone}
                  onChange={handleGiftShipping("phone")}
                  placeholder="No HP penerima"
                  className="w-full rounded-lg border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
                />
                <textarea
                  rows={3}
                  value={giftShipping.address}
                  onChange={handleGiftShipping("address")}
                  placeholder="Alamat lengkap pengiriman hadiah"
                  className="w-full rounded-lg border-slate-200 bg-white p-4 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}

function ImageUploadCard({
  id,
  title,
  description,
  image,
  onUpload,
  onRemove,
  badge = "Opsional",
  aspectClass = "aspect-[4/5]",
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    setIsDragOver(false);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = extractFilesFromDropEvent(event);
    if (!files.length) return;
    await onUpload(createSyntheticFileChangeEvent(files));
  };

  return (
    <article
      id={id}
      className={`rounded-2xl border bg-white p-4 shadow-sm transition-colors dark:bg-slate-900/40 ${isDragOver ? "border-primary ring-2 ring-primary/20 dark:border-primary" : "border-slate-200 dark:border-slate-700"}`}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          {badge}
        </span>
      </div>

      {image ? (
        <div className={`group relative overflow-hidden rounded-2xl border border-primary/10 bg-surface-light ${aspectClass}`}>
          <img src={image.url} alt={image.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{image.name}</p>
              <p className="text-xs text-white/75">{image.sizeLabel}</p>
            </div>
            <label className="shrink-0 cursor-pointer rounded-full bg-white/20 p-2 text-white backdrop-blur hover:bg-white/30">
              <span className="material-symbols-outlined text-xl">edit</span>
              <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
            </label>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-red-500 shadow-sm hover:text-red-600 dark:bg-black/60"
            aria-label={`Hapus ${title}`}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      ) : (
        <label className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary-50/40 text-center text-primary transition-colors hover:border-primary hover:bg-primary-50 dark:bg-primary-900/10 ${aspectClass}`}>
          <span className="material-symbols-outlined text-3xl">upload</span>
          <div>
            <p className="text-sm font-semibold">Upload atau Drop Foto</p>
            <p className="mt-1 text-[11px] text-primary/80">JPG/PNG, maksimal 5MB</p>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </label>
      )}
    </article>
  );
}

function StepThreeFoto({
  frontCoverImage,
  coverImage,
  openingThumbnailImage,
  groomPhoto,
  bridePhoto,
  akadCoverImage,
  resepsiCoverImage,
  saveTheDateBackgroundImage,
  wishesBackgroundImage,
  closingBackgroundImage,
  galleryImages,
  quote,
  quoteSource,
  quotePresetId,
  setQuote,
  setQuoteSource,
  onSelectQuotePreset,
  stories,
  setStories,
  isReceptionEnabled,
  onUploadCover,
  onUploadOpeningThumbnail,
  onUploadFrontCover,
  onUploadGroomPhoto,
  onRemoveGroomPhoto,
  onUploadBridePhoto,
  onRemoveBridePhoto,
  onUploadAkadCover,
  onRemoveAkadCover,
  onUploadResepsiCover,
  onRemoveResepsiCover,
  onUploadSaveTheDateBackground,
  onRemoveSaveTheDateBackground,
  onUploadWishesBackground,
  onRemoveWishesBackground,
  onUploadClosingBackground,
  onRemoveClosingBackground,
  onUploadLoveStoryPhotoOne,
  onRemoveLoveStoryPhotoOne,
  onUploadLoveStoryPhotoTwo,
  onRemoveLoveStoryPhotoTwo,
  onRemoveCover,
  onRemoveOpeningThumbnail,
  onRemoveFrontCover,
  onUploadGallery,
  onRemoveGallery,
  music,
  onChangeMusicMode,
  onChangeMusicTrack,
  onUploadCustomMusic,
  onToggleMusicPreview,
  packageConfig,
  uploadConfig,
}) {
  const galleryLimit = packageConfig?.limits?.galleryMax || 4;
  const canUploadCustomMusic = packageConfig?.capabilities?.customMusic === true;
  const canUseLoveStory = packageConfig?.capabilities?.loveStory === true;
  const uploadFields = uploadConfig || {};
  const canShowLoveStoryPhotos = canUseLoveStory && (uploadFields.loveStoryPhotoOne?.visible || uploadFields.loveStoryPhotoTwo?.visible);
  const singleCoverFlow = usesSingleCoverFlow(uploadFields);
  const frontCoverTitle = singleCoverFlow ? "Foto Cover Utama" : "Foto Cover Depan";
  const frontCoverUploadText = singleCoverFlow ? "Upload atau Drop Foto Cover Utama" : "Upload atau Drop Foto Cover Depan";
  const [dragTarget, setDragTarget] = useState("");
  const quotePresetGroups = QUOTE_CATEGORIES.map((category) => ({
    ...category,
    items: QUOTE_PRESETS.filter((preset) => preset.category === category.id),
  })).filter((category) => category.items.length > 0);

  const createDropZoneProps = (zoneId, onUpload) => ({
    onDragEnter: (event) => {
      event.preventDefault();
      setDragTarget(zoneId);
    },
    onDragOver: (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setDragTarget(zoneId);
    },
    onDragLeave: (event) => {
      event.preventDefault();
      const nextTarget = event.relatedTarget;
      if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
      setDragTarget((current) => (current === zoneId ? "" : current));
    },
    onDrop: async (event) => {
      event.preventDefault();
      setDragTarget((current) => (current === zoneId ? "" : current));
      const files = extractFilesFromDropEvent(event);
      if (!files.length) return;
      await onUpload(createSyntheticFileChangeEvent(files));
    },
  });

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Visual Undangan</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Sesuaikan foto, quote, dan media pendukung agar konten yang tampil tetap mengikuti desain tema yang dipilih.</p>
      </div>

      {uploadFields.frontCover?.visible && (
        <section id="cover_upload_section" className="space-y-4 mb-8">
          <div className="flex items-baseline justify-between px-1">
            <h3 className="text-lg font-bold">{frontCoverTitle}</h3>
            <span className="text-xs font-medium text-primary bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full">Wajib</span>
          </div>

          {frontCoverImage ? (
            <div
              className={`group relative w-full aspect-video rounded-lg overflow-hidden shadow-soft bg-surface-light dark:bg-surface-dark border transition-colors ${dragTarget === "front-cover" ? "border-primary ring-2 ring-primary/20" : "border-primary/10"}`}
              {...createDropZoneProps("front-cover", onUploadFrontCover)}
            >
              <img src={frontCoverImage.url} alt={frontCoverImage.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70"></div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{frontCoverImage.name}</p>
                  <p className="text-white/80 text-xs">{frontCoverImage.sizeLabel}</p>
                </div>
                <label className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full p-2 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-xl">edit</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onUploadFrontCover} />
                </label>
              </div>
              <button className="absolute top-3 right-3 bg-white/90 dark:bg-black/50 text-red-500 hover:text-red-600 rounded-full p-1.5 shadow-sm" type="button" onClick={onRemoveFrontCover}>
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          ) : (
            <label
              className={`w-full aspect-video rounded-lg border-2 border-dashed bg-primary-50/50 dark:bg-primary-900/10 flex flex-col items-center justify-center gap-2 text-primary cursor-pointer transition-colors ${dragTarget === "front-cover" ? "border-primary ring-2 ring-primary/20" : "border-primary/30 hover:border-primary"}`}
              {...createDropZoneProps("front-cover", onUploadFrontCover)}
            >
              <span className="material-symbols-outlined text-3xl">upload</span>
              <span className="text-sm font-semibold">{frontCoverUploadText}</span>
              <input type="file" accept="image/*" className="hidden" onChange={onUploadFrontCover} />
            </label>
          )}

          <p className="text-xs text-slate-500 px-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">info</span>
            {uploadFields.frontCover?.description}
          </p>
        </section>
      )}

      {(uploadFields.cover?.visible || uploadFields.openingThumbnail?.visible) && (
        <section id="inner_cover_upload_section" className="space-y-4 mb-8">
          <div className="flex items-baseline justify-between px-1">
            <h3 className="text-lg font-bold">Foto Setelah Buka Undangan</h3>
            <span className="text-xs font-medium text-primary bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full">Wajib</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {uploadFields.cover?.visible && (
              <ImageUploadCard
                id="after_open_desktop_upload_section"
                title="Cover Desktop"
                description={uploadFields.cover?.description}
                image={coverImage}
                onUpload={onUploadCover}
                onRemove={onRemoveCover}
                aspectClass="aspect-video"
                badge={uploadFields.cover?.required ? "Wajib" : "Opsional"}
              />
            )}
            {uploadFields.openingThumbnail?.visible && (
              <ImageUploadCard
                id="opening_thumbnail_upload_section"
                title="Foto Pasangan"
                description={uploadFields.openingThumbnail?.description}
                image={openingThumbnailImage}
                onUpload={onUploadOpeningThumbnail}
                onRemove={onRemoveOpeningThumbnail}
                aspectClass="aspect-video"
                badge={uploadFields.openingThumbnail?.required ? "Wajib" : "Opsional"}
              />
            )}
          </div>
        </section>
      )}

      <section className="mb-8 space-y-4">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="text-lg font-bold">Ayat / Quote</h3>
          <span className="text-xs font-medium text-primary bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full">Wajib</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 ml-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Pilih Preset Quote</label>
              <select
                value={quotePresetId}
                onChange={(event) => onSelectQuotePreset(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Pilih preset quote</option>
                {quotePresetGroups.map((category) => (
                  <optgroup key={category.id} label={category.label.id}>
                    {category.items.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label.id}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="manual">Tulis manual</option>
              </select>
              <p className="mt-1 ml-1 text-[11px] text-slate-500 dark:text-slate-400">Preset diambil dari katalog quote dan akan mengisi teks beserta sumbernya secara otomatis.</p>
            </div>
            <div>
              <label className="mb-1.5 ml-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Isi Ayat / Quote</label>
              <textarea
                id="quote_text"
                rows={4}
                value={quote}
                onChange={(event) => {
                  setQuote(event.target.value);
                  onSelectQuotePreset("manual", { preserveManualValues: true });
                }}
                placeholder="Contoh: Dan di antara tanda-tanda kekuasaan-Nya..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="mb-1.5 ml-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Sumber Ayat / Quote</label>
              <input
                id="quote_source"
                type="text"
                value={quoteSource}
                onChange={(event) => {
                  setQuoteSource(event.target.value);
                  onSelectQuotePreset("manual", { preserveManualValues: true });
                }}
                placeholder="Contoh: QS Ar-Rum: 21"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>
        </div>
      </section>

      {(uploadFields.bridePhoto?.visible || uploadFields.groomPhoto?.visible) && (
        <section className="mb-8 space-y-4">
          <div className="flex items-baseline justify-between px-1">
            <h3 className="text-lg font-bold">Foto Mempelai</h3>
            <span className="text-xs font-medium text-slate-500">Profil pasangan</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {uploadFields.bridePhoto?.visible && (
              <ImageUploadCard
                id="bride_photo_upload_section"
                title="Foto Mempelai Wanita"
                description={uploadFields.bridePhoto?.description}
                image={bridePhoto}
                onUpload={onUploadBridePhoto}
                onRemove={onRemoveBridePhoto}
                badge={uploadFields.bridePhoto?.required ? "Wajib" : "Opsional"}
              />
            )}
            {uploadFields.groomPhoto?.visible && (
              <ImageUploadCard
                id="groom_photo_upload_section"
                title="Foto Mempelai Pria"
                description={uploadFields.groomPhoto?.description}
                image={groomPhoto}
                onUpload={onUploadGroomPhoto}
                onRemove={onRemoveGroomPhoto}
                badge={uploadFields.groomPhoto?.required ? "Wajib" : "Opsional"}
              />
            )}
          </div>
        </section>
      )}

      {(uploadFields.akadCover?.visible || (isReceptionEnabled && uploadFields.resepsiCover?.visible)) && (
        <section className="mb-8 space-y-4">
          <div className="flex items-baseline justify-between px-1">
            <h3 className="text-lg font-bold">Foto Acara</h3>
            <span className="text-xs font-medium text-slate-500">Akad & resepsi</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {uploadFields.akadCover?.visible && (
              <ImageUploadCard
                id="akad_cover_upload_section"
                title="Cover Akad"
                description={uploadFields.akadCover?.description}
                image={akadCoverImage}
                onUpload={onUploadAkadCover}
                onRemove={onRemoveAkadCover}
                aspectClass="aspect-video"
                badge={uploadFields.akadCover?.required ? "Wajib" : "Opsional"}
              />
            )}
            {isReceptionEnabled && uploadFields.resepsiCover?.visible ? (
              <ImageUploadCard
                id="resepsi_cover_upload_section"
                title="Cover Resepsi"
                description={uploadFields.resepsiCover?.description}
                image={resepsiCoverImage}
                onUpload={onUploadResepsiCover}
                onRemove={onRemoveResepsiCover}
                aspectClass="aspect-video"
                badge={uploadFields.resepsiCover?.required ? "Wajib" : "Opsional"}
              />
            ) : uploadFields.resepsiCover?.visible ? (
              <article className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/20 dark:text-slate-400">
                Cover resepsi tidak diperlukan karena acara resepsi belum diaktifkan.
              </article>
            ) : null}
          </div>
        </section>
      )}

      {uploadFields.closingBackground?.visible && (
        <section className="mb-8 space-y-4">
          <div className="flex items-baseline justify-between px-1">
            <h3 className="text-lg font-bold">Background Penutup</h3>
            <span className="text-xs font-medium text-primary bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full">Wajib</span>
          </div>
          <ImageUploadCard
            id="closing_background_upload_section"
            title="Foto Background Pasangan"
            description={uploadFields.closingBackground?.description}
            image={closingBackgroundImage}
            onUpload={onUploadClosingBackground}
            onRemove={onRemoveClosingBackground}
            aspectClass="aspect-video"
            badge={uploadFields.closingBackground?.required ? "Wajib" : "Opsional"}
          />
        </section>
      )}

      {canShowLoveStoryPhotos && (
        <section className="mb-8 space-y-4">
          <div className="flex items-baseline justify-between px-1">
            <h3 className="text-lg font-bold">Thumbnail Love Story</h3>
            <span className="text-xs font-medium text-primary bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full">Wajib</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {uploadFields.loveStoryPhotoOne?.visible && (
              <ImageUploadCard
                id="love_story_photo_one_upload_section"
                title="Thumbnail Love Story 1"
                description={uploadFields.loveStoryPhotoOne?.description}
                image={stories[0]?.photo || null}
                onUpload={onUploadLoveStoryPhotoOne}
                onRemove={onRemoveLoveStoryPhotoOne}
                aspectClass="aspect-video"
                badge={uploadFields.loveStoryPhotoOne?.required ? "Wajib" : "Opsional"}
              />
            )}
            {uploadFields.loveStoryPhotoTwo?.visible && (
              <ImageUploadCard
                id="love_story_photo_two_upload_section"
                title="Thumbnail Love Story 2"
                description={uploadFields.loveStoryPhotoTwo?.description}
                image={stories[1]?.photo || null}
                onUpload={onUploadLoveStoryPhotoTwo}
                onRemove={onRemoveLoveStoryPhotoTwo}
                aspectClass="aspect-video"
                badge={uploadFields.loveStoryPhotoTwo?.required ? "Wajib" : "Opsional"}
              />
            )}
          </div>
        </section>
      )}

      {(uploadFields.saveTheDateBackground?.visible || uploadFields.wishesBackground?.visible) && (
        <section className="mb-8 space-y-4">
          <div className="flex items-baseline justify-between px-1">
            <h3 className="text-lg font-bold">Background Tambahan Tema</h3>
            <span className="text-xs font-medium text-primary bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full">Wajib</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {uploadFields.saveTheDateBackground?.visible && (
              <ImageUploadCard
                id="save_the_date_background_upload_section"
                title="Background Save The Date"
                description={uploadFields.saveTheDateBackground?.description}
                image={saveTheDateBackgroundImage}
                onUpload={onUploadSaveTheDateBackground}
                onRemove={onRemoveSaveTheDateBackground}
                aspectClass="aspect-video"
                badge={uploadFields.saveTheDateBackground?.required ? "Wajib" : "Opsional"}
              />
            )}
            {uploadFields.wishesBackground?.visible && (
              <ImageUploadCard
                id="wishes_background_upload_section"
                title="Background Wishes / Ucapan"
                description={uploadFields.wishesBackground?.description}
                image={wishesBackgroundImage}
                onUpload={onUploadWishesBackground}
                onRemove={onRemoveWishesBackground}
                aspectClass="aspect-video"
                badge={uploadFields.wishesBackground?.required ? "Wajib" : "Opsional"}
              />
            )}
          </div>
        </section>
      )}

      <section id="gallery_upload_section" className="space-y-4 mb-8">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="text-lg font-bold">Galeri Prewedding</h3>
          <span className="text-xs font-medium text-primary bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full">Wajib</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {galleryImages.map((image) => (
            <div key={image.id} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm">
              <img alt={image.name} className="w-full h-full object-cover" src={image.url} />
              <button className="absolute top-1 right-1 bg-black/40 backdrop-blur-sm text-white rounded-full p-1 hover:bg-red-500 transition-colors" type="button" onClick={() => onRemoveGallery(image.id)}>
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}

          {galleryImages.length < galleryLimit && (
            <label
              className={`aspect-square rounded-xl border-2 border-dashed bg-primary-50/50 dark:bg-primary-900/10 flex flex-col items-center justify-center gap-1 text-primary transition-all group cursor-pointer ${dragTarget === "gallery" ? "border-primary ring-2 ring-primary/20 bg-primary-50 dark:bg-primary-900/20" : "border-primary/30 hover:border-primary hover:bg-primary-50 dark:hover:bg-primary-900/20"}`}
              {...createDropZoneProps("gallery", onUploadGallery)}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-lg">add</span>
              </div>
              <span className="text-[10px] font-semibold">Tambah / Drop</span>
              <input type="file" accept="image/*" className="hidden" multiple onChange={onUploadGallery} />
            </label>
          )}

          {Array.from({ length: Math.max(0, galleryLimit - galleryImages.length - 1) }).map((_, idx) => (
            <div key={idx} className="aspect-square rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-transparent flex items-center justify-center text-gray-300 dark:text-gray-700">
              <span className="material-symbols-outlined text-xl">image</span>
            </div>
          ))}
        </div>
        <p className="px-1 text-xs text-slate-500 dark:text-slate-400">
          Paket {packageConfig?.tier || "BASIC"} mendukung maksimal {galleryLimit} foto galeri.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="text-lg font-bold">Musik</h3>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <label className="block cursor-pointer border-b border-gray-100 dark:border-gray-800">
            <input
              className="hidden"
              name="music_option"
              type="radio"
              checked={music.mode === "list"}
              onChange={() => onChangeMusicMode("list")}
            />
            <div className={`p-4 flex items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark/50 ${music.mode === "list" ? "bg-primary-50/70 dark:bg-primary/10" : ""}`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center relative ${music.mode === "list" ? "border-primary" : "border-gray-300 dark:border-gray-600"}`}>
                  <div className={`w-2.5 h-2.5 rounded-full transition-transform duration-200 ${music.mode === "list" ? "scale-100 bg-primary" : "scale-0 bg-white"}`}></div>
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">Pilih dari List</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Koleksi lagu romantis pilihan</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary text-xl">library_music</span>
            </div>

            {music.mode === "list" && (
              <div className="p-4 pt-0 bg-primary-50/30 dark:bg-primary-900/5 space-y-3 border-t border-primary/10">
                <div className="relative mt-3">
                  <select
                    value={music.selectedTrackId}
                    onChange={(event) => onChangeMusicTrack(event.target.value)}
                    className="w-full appearance-none bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-slate-900 dark:text-slate-100 text-sm rounded-lg py-3 pl-4 pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    {MUSIC_TRACKS.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-surface-dark/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
                  <button
                    type="button"
                    onClick={onToggleMusicPreview}
                    className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-600 transition-colors shadow-sm flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-lg">{music.isPlaying ? "pause" : "play_arrow"}</span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full bg-primary rounded-full transition-all ${music.isPlaying ? "w-full" : "w-1/3"}`}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-medium">
                      <span className="truncate max-w-[140px]">{music.selectedTrackLabel}</span>
                      <span>{music.isPlaying ? "Playing" : "Ready"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </label>

          {canUploadCustomMusic ? (
            <label className="block cursor-pointer">
              <input
                className="hidden"
                name="music_option"
                type="radio"
                checked={music.mode === "upload"}
                onChange={() => onChangeMusicMode("upload")}
              />
              <div className={`p-4 flex items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark/50 ${music.mode === "upload" ? "bg-primary-50/70 dark:bg-primary/10" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center relative ${music.mode === "upload" ? "border-primary" : "border-gray-300 dark:border-gray-600"}`}>
                    <div className={`w-2.5 h-2.5 rounded-full transition-transform duration-200 ${music.mode === "upload" ? "scale-100 bg-primary" : "scale-0 bg-white"}`}></div>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">Upload Musik Sendiri</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Gunakan file MP3 pribadi (Max 5MB)</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-xl">upload_file</span>
              </div>

              {music.mode === "upload" && (
                <div className="p-4 pt-0 bg-primary-50/30 dark:bg-primary-900/5 border-t border-primary/10">
                  <label className="mt-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:bg-white dark:hover:bg-surface-dark/30 hover:border-primary/50 transition-all cursor-pointer group block">
                    <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined">cloud_upload</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {music.uploadedFile?.name ? "Ganti file musik" : "Klik untuk upload"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {music.uploadedFile?.name ? `${music.uploadedFile.name} (${music.uploadedFile.sizeLabel})` : "File MP3 only, maksimal 5MB"}
                    </p>
                    <input id="music_upload_input" type="file" accept="audio/mpeg,audio/mp3,.mp3" className="hidden" onChange={onUploadCustomMusic} />
                  </label>
                </div>
              )}
            </label>
          ) : (
            <div className="border-t border-gray-100 dark:border-gray-800 bg-slate-50/80 dark:bg-slate-900/40 px-4 py-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Paket BASIC hanya bisa memilih musik dari list yang tersedia.</p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Upload musik custom dibuka mulai paket PREMIUM.</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 mb-8">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="text-lg font-bold">Love Story</h3>
          <span className="text-xs font-medium text-primary bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full">Wajib</span>
        </div>

        {!canUseLoveStory && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tema BASIC tidak menampilkan section Love Story. Fokus konten BASIC ada di cover, profil pasangan, detail acara, galeri, dan RSVP.
          </div>
        )}

        {canUseLoveStory && (
          <div className="relative space-y-6 pl-3">
            <div className="absolute left-7 top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
            {stories.map((story, index) => (
              <div key={story.id} className="group relative">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1 z-10">
                    <div
                      className={`w-8 h-8 rounded-full bg-surface-light dark:bg-surface-dark border-2 flex items-center justify-center shadow-sm ${index === 0
                        ? "border-primary text-primary"
                        : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
                        }`}
                    >
                      <span className="material-symbols-outlined text-sm">{index === 0 ? "favorite" : "handshake"}</span>
                    </div>
                  </div>
                  <div className="flex-grow space-y-3 bg-surface-light dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm focus-within:ring-1 focus-within:ring-primary/40 focus-within:border-primary/50 transition-all">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Momen {index === 0 ? "Pertama" : `Ke-${index + 1}`}
                      </label>
                      <input
                        data-story-title={story.id}
                        className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 pb-2 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:border-primary focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none transition-colors"
                        placeholder={index === 0 ? "Contoh: Pertama Bertemu" : "Contoh: Menjalin Asmara"}
                        value={story.title}
                        onChange={(e) =>
                          setStories((prev) => prev.map((item) => (item.id === story.id ? { ...item, title: e.target.value } : item)))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <textarea
                        data-story-description={story.id}
                        className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-slate-100 text-sm resize-none focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none"
                        placeholder={index === 0 ? "Ceritakan bagaimana momen itu terjadi..." : "Ceritakan proses kedekatan kalian..."}
                        rows={3}
                        value={story.description}
                        onChange={(e) =>
                          setStories((prev) =>
                            prev.map((item) => (item.id === story.id ? { ...item, description: e.target.value } : item)),
                          )
                        }
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800 gap-2">
                      <input
                        data-story-date={story.id}
                        className="text-xs bg-transparent border-none p-0 text-primary font-medium w-full focus:ring-0 placeholder:text-primary/60"
                        placeholder="Tahun / Tanggal"
                        value={story.date}
                        onChange={(e) =>
                          setStories((prev) => prev.map((item) => (item.id === story.id ? { ...item, date: e.target.value } : item)))
                        }
                      />
                      {(canShowLoveStoryPhotos ? index > 1 : index > 0) && (
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setStories((prev) => prev.filter((item) => item.id !== story.id))}
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="pl-12">
              <button
                type="button"
                onClick={() =>
                  setStories((prev) => [
                    ...prev,
                    { id: Date.now(), title: "", description: "", date: "", photo: null },
                  ])
                }
                className="w-full py-3 border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center gap-2 text-primary text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Tambah Cerita Baru
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function StepFourReview({
  frontCoverImage,
  customer,
  groom,
  bride,
  akad,
  resepsi,
  isSessionEnabled,
  sessions,
  coverImage,
  openingThumbnailImage,
  quote,
  quoteSource,
  saveTheDateBackgroundImage,
  wishesBackgroundImage,
  closingBackgroundImage,
  galleryImages,
  stories,
  music,
  giftBankList,
  giftShipping,
  onCopyPayment,
  selectedPackage,
  uploadConfig,
}) {
  const effectiveStoriesCount = selectedPackage?.capabilities?.loveStory ? stories.length : 0;
  const uploadFields = uploadConfig || {};
  const singleCoverFlow = usesSingleCoverFlow(uploadFields);
  const frontCoverLabel = singleCoverFlow ? "Cover Utama" : "Cover Depan";
  const normalizedGiftBankList = normalizeGiftBankList(giftBankList);
  const normalizedGiftShipping = normalizeGiftShipping(giftShipping);
  const canUseDigitalEnvelope = selectedPackage?.capabilities?.digitalEnvelope === true;

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Cek Data Terakhir</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Pastikan semua data sudah benar sebelum undangan dibuat.</p>
      </div>

      <div className="flex flex-col gap-4 mt-6">
        <details className="group bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-primary/10 dark:border-primary/5 overflow-hidden" open>
          <summary className="flex cursor-pointer items-center justify-between p-4 select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">person</span></div>
              <h3 className="font-bold text-base">Info Customer & Mempelai</h3>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform duration-300">expand_more</span>
          </summary>
          <div className="px-4 pb-5 border-t border-dashed border-slate-200 dark:border-slate-700/50">
            <div className="pt-4 grid gap-3 mb-5">
              <div><p className="text-xs text-slate-500">Nama Customer</p><p className="text-sm font-medium">{customer.name || "-"}</p></div>
              <div><p className="text-xs text-slate-500">No HP / WA</p><p className="text-sm font-medium">{customer.phone || "-"}</p></div>
              <div><p className="text-xs text-slate-500">Email</p><p className="text-sm font-medium">{customer.email || "-"}</p></div>
              <div><p className="text-xs text-slate-500">Alamat</p><p className="text-sm font-medium">{customer.address || "-"}</p></div>
            </div>

            <div className="pt-2 grid gap-3">
              <div><p className="text-xs text-slate-500">Mempelai Pria</p><p className="text-sm font-medium">{groom.fullname || "-"}</p><p className="text-xs text-slate-500">{groom.parents || "-"}</p></div>
              <div><p className="text-xs text-slate-500">Mempelai Wanita</p><p className="text-sm font-medium">{bride.fullname || "-"}</p><p className="text-xs text-slate-500">{bride.parents || "-"}</p></div>
            </div>
          </div>
        </details>

        <details className="group bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-primary/10 dark:border-primary/5 overflow-hidden">
          <summary className="flex cursor-pointer items-center justify-between p-4 select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">event_available</span></div>
              <h3 className="font-bold text-base">Detail Acara</h3>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform duration-300">expand_more</span>
          </summary>
          <div className="px-4 pb-5 border-t border-dashed border-slate-200 dark:border-slate-700/50">
            <div className="pt-4 grid gap-3 mb-4">
              <div><p className="text-xs text-slate-500">Tanggal Akad</p><p className="text-sm font-medium">{formatDateID(akad.date)}</p></div>
              <div><p className="text-xs text-slate-500">Waktu</p><p className="text-sm font-medium">{akad.startTime || "-"} - {akad.endTime || "-"} WIB</p></div>
              <div><p className="text-xs text-slate-500">Lokasi</p><p className="text-sm font-medium">{akad.venue || "-"}</p></div>
            </div>
            <div className="grid gap-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700/50">
              <div><p className="text-xs text-slate-500">Tanggal Resepsi</p><p className="text-sm font-medium">{formatDateID(resepsi.date)}</p></div>
              <div><p className="text-xs text-slate-500">Waktu</p><p className="text-sm font-medium">{resepsi.startTime || "-"} - {resepsi.endTime || "-"} WIB</p></div>
              <div><p className="text-xs text-slate-500">Lokasi</p><p className="text-sm font-medium">{resepsi.venue || "-"}</p></div>
              {isSessionEnabled && (
                <div><p className="text-xs text-slate-500">Teks Sesi di Bawah Resepsi</p><p className="text-sm font-medium">{formatSessionsSummary(sessions) || "-"}</p></div>
              )}
            </div>
          </div>
        </details>

        <details className="group bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-primary/10 dark:border-primary/5 overflow-hidden">
          <summary className="flex cursor-pointer items-center justify-between p-4 select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">photo_library</span></div>
              <h3 className="font-bold text-base">Foto & Cerita</h3>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform duration-300">expand_more</span>
          </summary>
          <div className="px-4 pb-5 border-t border-dashed border-slate-200 dark:border-slate-700/50">
            {uploadFields.frontCover?.visible && (
              <div className="pt-4">
                <p className="text-xs text-slate-500 mb-2">{frontCoverLabel}</p>
                <p className="text-sm font-medium">{frontCoverImage?.name || "Belum upload"}</p>
              </div>
            )}
            {uploadFields.cover?.visible && (
              <div className="pt-3">
                <p className="text-xs text-slate-500 mb-2">Cover Dalam Desktop</p>
                <p className="text-sm font-medium">{coverImage?.name || "Belum upload"}</p>
              </div>
            )}
            {uploadFields.openingThumbnail?.visible && (
              <div className="pt-3">
                <p className="text-xs text-slate-500 mb-2">Thumbnail Pasangan Section Pertama</p>
                <p className="text-sm font-medium">{openingThumbnailImage?.name || "Belum upload"}</p>
              </div>
            )}
            {uploadFields.bridePhoto?.visible && (
              <div className="pt-3">
                <p className="text-xs text-slate-500 mb-2">Foto Mempelai Wanita</p>
                <p className="text-sm font-medium">{bride.photo?.name || "Belum upload"}</p>
              </div>
            )}
            {uploadFields.groomPhoto?.visible && (
              <div className="pt-3">
                <p className="text-xs text-slate-500 mb-2">Foto Mempelai Pria</p>
                <p className="text-sm font-medium">{groom.photo?.name || "Belum upload"}</p>
              </div>
            )}
            {uploadFields.akadCover?.visible && (
              <div className="pt-3">
                <p className="text-xs text-slate-500 mb-2">Cover Akad</p>
                <p className="text-sm font-medium">{akad.coverImage?.name || "Belum upload"}</p>
              </div>
            )}
            {uploadFields.resepsiCover?.visible && (
              <div className="pt-3">
                <p className="text-xs text-slate-500 mb-2">Cover Resepsi</p>
                <p className="text-sm font-medium">{resepsi.coverImage?.name || "Belum upload"}</p>
              </div>
            )}
            {uploadFields.closingBackground?.visible && (
              <div className="pt-3">
                <p className="text-xs text-slate-500 mb-2">Background Penutup</p>
                <p className="text-sm font-medium">{closingBackgroundImage?.name || "Belum upload"}</p>
              </div>
            )}
            {uploadFields.saveTheDateBackground?.visible && (
              <div className="pt-3">
                <p className="text-xs text-slate-500 mb-2">Background Save The Date</p>
                <p className="text-sm font-medium">{saveTheDateBackgroundImage?.name || "Belum upload"}</p>
              </div>
            )}
            {uploadFields.wishesBackground?.visible && (
              <div className="pt-3">
                <p className="text-xs text-slate-500 mb-2">Background Wishes / Ucapan</p>
                <p className="text-sm font-medium">{wishesBackgroundImage?.name || "Belum upload"}</p>
              </div>
            )}
            <div className="pt-3">
              <p className="text-xs text-slate-500 mb-2">Galeri</p>
              <p className="text-sm font-medium">{galleryImages.length} foto</p>
            </div>
            <div className="pt-3">
              <p className="text-xs text-slate-500 mb-2">Ayat / Quote</p>
              <p className="text-sm font-medium">{quote || "Belum diisi"}</p>
              <p className="text-xs text-slate-500 mt-1">{quoteSource || "-"}</p>
            </div>
            <div className="pt-3">
              <p className="text-xs text-slate-500 mb-2">Cerita Cinta</p>
              <p className="text-sm font-medium">
                {selectedPackage?.capabilities?.loveStory ? `${effectiveStoriesCount} momen` : "Tidak aktif di paket ini"}
              </p>
            </div>
            {uploadFields.loveStoryPhotoOne?.visible && (
              <div className="pt-3">
                <p className="text-xs text-slate-500 mb-2">Thumbnail Love Story 1</p>
                <p className="text-sm font-medium">{stories[0]?.photo?.name || "Belum upload"}</p>
              </div>
            )}
            {uploadFields.loveStoryPhotoTwo?.visible && (
              <div className="pt-3">
                <p className="text-xs text-slate-500 mb-2">Thumbnail Love Story 2</p>
                <p className="text-sm font-medium">{stories[1]?.photo?.name || "Belum upload"}</p>
              </div>
            )}
            <div className="pt-3">
              <p className="text-xs text-slate-500 mb-2">Musik</p>
              <p className="text-sm font-medium">
                {music.mode === "list" ? `List: ${music.selectedTrackLabel}` : `Upload: ${music.uploadedFile?.name || "-"}`}
              </p>
            </div>
          </div>
        </details>
      </div>

      {canUseDigitalEnvelope && (
        <div className="mt-4 bg-surface-light dark:bg-surface-dark rounded-lg p-5 border border-primary/10">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">account_balance_wallet</span>
            Wedding Gift / Amplop Digital
          </h4>

          {normalizedGiftBankList.length === 0 && !normalizedGiftShipping.recipient && !normalizedGiftShipping.phone && !normalizedGiftShipping.address ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Belum diisi. Section gift akan kosong sampai data rekening atau alamat pengiriman ditambahkan.</p>
          ) : (
            <div className="space-y-3">
              {normalizedGiftBankList.map((bank, index) => (
                <article key={`${bank.bank}-${bank.account}-${index}`} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-bold text-sm">{bank.bank || `Rekening ${index + 1}`}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{bank.name || "Nama pemilik belum diisi"}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Nomor Rekening / E-Wallet</p>
                      <p className="text-lg font-mono font-bold tracking-wide">{bank.account || "-"}</p>
                    </div>
                    {bank.account ? (
                      <button
                        type="button"
                        onClick={() => onCopyPayment(bank.account)}
                        className="text-primary text-xs font-bold bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-600 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>Salin
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}

              {(normalizedGiftShipping.recipient || normalizedGiftShipping.phone || normalizedGiftShipping.address) && (
                <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                  <h5 className="font-bold text-sm mb-3">Alamat Pengiriman Hadiah</h5>
                  <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                    <p>Nama Penerima: {normalizedGiftShipping.recipient || "-"}</p>
                    <p>No. HP: {normalizedGiftShipping.phone || "-"}</p>
                    <p>{normalizedGiftShipping.address || "-"}</p>
                  </div>
                </article>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 bg-primary/5 rounded-lg p-5 border border-primary/10 flex justify-between items-center">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Total Biaya</p>
          <div className="flex items-baseline gap-1">
            <span className="text-primary text-xl font-bold">{formatMoneyID(selectedPackage.price)}</span>
            <span className="text-slate-400 text-xs line-through">{formatMoneyID(selectedPackage.oldPrice)}</span>
          </div>
          <p className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit mt-1 font-medium">
            Paket {selectedPackage?.tier || "BASIC"} - {selectedPackage.discount}
          </p>
        </div>
        <div className="h-10 w-10 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center text-primary shadow-sm">
          <span className="material-symbols-outlined">receipt_long</span>
        </div>
      </div>
    </>
  );
}

export default function CreateInvitationFormPage() {
  const { themes: availableThemes, loading: themesLoading } = useThemeCatalog();
  const [currentStep, setCurrentStep] = useState(1);
  const isReceptionEnabled = true;
  const [isSessionEnabled, setIsSessionEnabled] = useState(false);
  const [formAlert, setFormAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitFailed, setHasSubmitFailed] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const contentRef = useRef(null);
  const draftOrderIdRef = useRef(createOrderId());

  const [customer, setCustomer] = useState(INITIAL_CUSTOMER);
  const [groom, setGroom] = useState(INITIAL_GROOM);
  const [bride, setBride] = useState(INITIAL_BRIDE);

  const [akad, setAkad] = useState(INITIAL_AKAD);
  const [resepsi, setResepsi] = useState(INITIAL_RESEPSI);

  const [sessions, setSessions] = useState(INITIAL_SESSIONS);

  const [coverImage, setCoverImage] = useState(null);
  const [frontCoverImage, setFrontCoverImage] = useState(null);
  const [openingThumbnailImage, setOpeningThumbnailImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [quotePresetId, setQuotePresetId] = useState("");
  const [quote, setQuote] = useState("");
  const [quoteSource, setQuoteSource] = useState("");
  const [giftBankList, setGiftBankList] = useState(INITIAL_GIFT_BANKS);
  const [giftShipping, setGiftShipping] = useState(INITIAL_GIFT_SHIPPING);
  const [saveTheDateBackgroundImage, setSaveTheDateBackgroundImage] = useState(null);
  const [wishesBackgroundImage, setWishesBackgroundImage] = useState(null);
  const [closingBackgroundImage, setClosingBackgroundImage] = useState(null);
  const [stories, setStories] = useState(INITIAL_STORIES);
  const [musicMode, setMusicMode] = useState("list");
  const [selectedMusicTrackId, setSelectedMusicTrackId] = useState(MUSIC_TRACKS[0].id);
  const [uploadedMusicFile, setUploadedMusicFile] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const musicPreviewRef = useRef(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const selectedPackage = useMemo(() => getPackageConfig(selectedTheme?.packageTier), [selectedTheme?.packageTier]);
  const uploadConfig = useMemo(() => getThemeUploadConfig(selectedTheme, selectedPackage), [selectedTheme, selectedPackage]);
  const canUseDigitalEnvelope = selectedPackage?.capabilities?.digitalEnvelope === true;
  const selectedMusicTrack = useMemo(
    () => MUSIC_TRACKS.find((track) => track.id === selectedMusicTrackId) || MUSIC_TRACKS[0],
    [selectedMusicTrackId],
  );
  const maxUploadBytes = 5 * 1024 * 1024;
  const isFormDirty = useMemo(() => {
    const hasCustomer = Boolean(customer.name || customer.phone || customer.email || customer.address);
    const hasCouple = Boolean(
      groom.fullname ||
      groom.nickname ||
      groom.parents ||
      groom.instagram ||
      (uploadConfig.groomPhoto?.visible && groom.photo) ||
      bride.fullname ||
      bride.nickname ||
      bride.parents ||
      bride.instagram ||
      (uploadConfig.bridePhoto?.visible && bride.photo)
    );
    const hasAcara = Boolean(
      akad.date ||
      akad.startTime ||
      akad.endTime ||
      akad.venue ||
      akad.address ||
      akad.mapsLink ||
      (uploadConfig.akadCover?.visible && akad.coverImage)
    );
    const hasResepsi = Boolean(
      resepsi.date ||
      resepsi.startTime ||
      resepsi.endTime ||
      resepsi.venue ||
      resepsi.address ||
      resepsi.mapsLink ||
      (uploadConfig.resepsiCover?.visible && resepsi.coverImage) ||
      isSessionEnabled
    );
    const hasMedia = Boolean(
      (uploadConfig.cover?.visible && coverImage) ||
      (uploadConfig.frontCover?.visible && frontCoverImage) ||
      (uploadConfig.openingThumbnail?.visible && openingThumbnailImage) ||
      (uploadConfig.saveTheDateBackground?.visible && saveTheDateBackgroundImage) ||
      (uploadConfig.wishesBackground?.visible && wishesBackgroundImage) ||
      (uploadConfig.closingBackground?.visible && closingBackgroundImage) ||
      quote ||
      quoteSource ||
      galleryImages.length > 0 ||
      stories.some((story) => story.title || story.description || story.date || story.photo)
    );
    const hasGift = canUseDigitalEnvelope && hasGiftContent(giftBankList, giftShipping);
    const hasMusic = Boolean(musicMode === "upload" || uploadedMusicFile || selectedMusicTrackId !== MUSIC_TRACKS[0].id);
    return currentStep > 1 || hasCustomer || hasCouple || hasAcara || hasResepsi || hasMedia || hasGift || hasMusic;
  }, [
    currentStep,
    customer,
    groom,
    bride,
    akad,
    uploadConfig,
    isSessionEnabled,
    resepsi,
    coverImage,
    frontCoverImage,
    openingThumbnailImage,
    saveTheDateBackgroundImage,
    wishesBackgroundImage,
    closingBackgroundImage,
    canUseDigitalEnvelope,
    giftBankList,
    giftShipping,
    galleryImages.length,
    quote,
    quoteSource,
    stories,
    musicMode,
    uploadedMusicFile,
    selectedMusicTrackId,
  ]);

  useEffect(() => {
    if (!availableThemes.length) return;
    setSelectedTheme((currentTheme) => {
      if (currentTheme && availableThemes.some((theme) => theme.slug === currentTheme.slug)) {
        return currentTheme;
      }
      return resolveInitialTheme(availableThemes);
    });
  }, [availableThemes]);

  useEffect(() => {
    if (!selectedTheme) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set("theme", selectedTheme.slug);
    params.set("preset_id", selectedTheme.presetId);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", nextUrl);
  }, [selectedTheme]);

  useEffect(() => {
    if (!uploadConfig.frontCover?.visible) setFrontCoverImage(null);
    if (!uploadConfig.cover?.visible) setCoverImage(null);
    if (!uploadConfig.openingThumbnail?.visible) setOpeningThumbnailImage(null);
    if (!uploadConfig.bridePhoto?.visible) {
      setBride((prev) => (prev.photo ? { ...prev, photo: null } : prev));
    }
    if (!uploadConfig.groomPhoto?.visible) {
      setGroom((prev) => (prev.photo ? { ...prev, photo: null } : prev));
    }
    if (!uploadConfig.akadCover?.visible) {
      setAkad((prev) => (prev.coverImage ? { ...prev, coverImage: null } : prev));
    }
    if (!uploadConfig.resepsiCover?.visible) {
      setResepsi((prev) => (prev.coverImage ? { ...prev, coverImage: null } : prev));
    }
    if (!uploadConfig.saveTheDateBackground?.visible) setSaveTheDateBackgroundImage(null);
    if (!uploadConfig.wishesBackground?.visible) setWishesBackgroundImage(null);
    if (!uploadConfig.closingBackground?.visible) setClosingBackgroundImage(null);
    if (!uploadConfig.loveStoryPhotoOne?.visible && !uploadConfig.loveStoryPhotoTwo?.visible) {
      setStories((prev) => prev.map((story) => (story.photo ? { ...story, photo: null } : story)));
    }
  }, [uploadConfig]);

  useEffect(() => {
    if (canUseDigitalEnvelope) return;
    setGiftBankList(INITIAL_GIFT_BANKS.map((item) => ({ ...item })));
    setGiftShipping({ ...INITIAL_GIFT_SHIPPING });
  }, [canUseDigitalEnvelope]);

  useEffect(() => {
    const galleryLimit = selectedPackage?.limits?.galleryMax || 4;

    if (galleryImages.length > galleryLimit) {
      setGalleryImages((prev) => prev.slice(0, galleryLimit));
      showAlert("info", `Galeri disesuaikan ke batas paket ${selectedPackage.tier}: maksimal ${galleryLimit} foto.`);
    }

    if (!selectedPackage?.capabilities?.customMusic && musicMode === "upload") {
      setMusicMode("list");
      setUploadedMusicFile(null);
      setIsMusicPlaying(false);
      if (musicPreviewRef.current) {
        musicPreviewRef.current.pause();
        musicPreviewRef.current.currentTime = 0;
      }
      showAlert("info", `Upload musik hanya tersedia mulai paket PREMIUM. Mode musik dikembalikan ke list.`);
    }
  }, [selectedPackage, galleryImages.length, musicMode]);

  useEffect(() => {
    if (musicMode !== "list") return;
    if (!musicPreviewRef.current) return;
    musicPreviewRef.current.pause();
    musicPreviewRef.current.currentTime = 0;
    setIsMusicPlaying(false);
  }, [selectedMusicTrackId, musicMode]);

  useEffect(
    () => () => {
      if (musicPreviewRef.current) {
        musicPreviewRef.current.pause();
        musicPreviewRef.current.src = "";
      }
    },
    [],
  );

  useEffect(() => {
    if (!isFormDirty || isSubmitting) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFormDirty, isSubmitting]);

  const showAlert = (type, message) => {
    setFormAlert({ type, message });
  };

  const confirmExitIfDirty = () => {
    if (!isFormDirty || isSubmitting) return Promise.resolve(true);
    return new Promise((resolve) => {
      setConfirmDialog({
        message: "Data form belum disubmit. Yakin ingin keluar dari halaman buat undangan?",
        onConfirm: (confirmed) => {
          setConfirmDialog(null);
          resolve(confirmed);
        },
      });
    });
  };

  const tips = useMemo(() => {
    if (currentStep === 2) {
      return ["Isi tanggal, jam, dan alamat acara dengan detail.", "Tempel link Google Maps agar tamu tidak tersesat.", "Resepsi sekarang selalu aktif dan wajib diisi.", "Aktifkan pembagian sesi hanya jika tamu datang per gelombang waktu."];
    }
    if (currentStep === 3) {
      if (selectedTheme?.slug === "puspa-asmara") {
        return ["Cover depan memakai asset bawaan template dan tidak perlu diupload.", "Upload cover dalam desktop untuk tampilan setelah undangan dibuka.", "Upload thumbnail pasangan untuk section pertama setelah undangan dibuka.", "Tambahkan cover akad dan resepsi agar section acara lebih hidup."];
      }
      return ["Upload cover depan khusus untuk halaman sampul sebelum undangan dibuka.", "Upload foto setelah buka undangan untuk hero section di bagian dalam.", "Tambahkan cover akad dan resepsi agar section acara lebih hidup.", "Isi ayat atau quote agar area opening mengikuti template BASIC."];
    }
    if (currentStep === 4) {
      return ["Periksa kembali nama mempelai dan orang tua.", "Pastikan jadwal acara sudah benar.", "Lihat ulang galeri dan cerita cinta.", "Jika semua benar, lanjut submit pesanan."];
    }
    return ["Gunakan nama lengkap sesuai identitas.", "Isi nama orang tua sesuai format undangan.", "Akun Instagram opsional, bisa dikosongkan.", "Klik Selanjutnya untuk lanjut ke data acara."];
  }, [currentStep, selectedTheme?.slug]);

  const addSession = () => setSessions((prev) => [...prev, { id: Date.now(), start: "13:00", end: "14:00" }]);
  const removeSession = (id) => setSessions((prev) => prev.filter((session) => session.id !== id));
  const updateSession = (id, key, value) => setSessions((prev) => prev.map((session) => (session.id === id ? { ...session, [key]: value } : session)));

  const readSingleImageFromInput = async (event, label) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showAlert("error", `${label} harus berupa file gambar.`);
      event.target.value = "";
      return null;
    }
    if (file.size > maxUploadBytes) {
      showAlert("error", `Ukuran ${label.toLowerCase()} maksimal 5MB.`);
      event.target.value = "";
      return null;
    }
    const url = await readFileAsDataUrl(file);
    event.target.value = "";
    return createLocalImageAsset(file, url);
  };

  const handleUploadCover = async (event) => {
    const asset = await readSingleImageFromInput(event, "cover dalam desktop");
    if (asset) {
      setCoverImage(asset);
    }
  };

  const handleUploadFrontCover = async (event) => {
    const asset = await readSingleImageFromInput(event, "foto cover depan");
    if (asset) {
      setFrontCoverImage(asset);
    }
  };

  const handleUploadOpeningThumbnail = async (event) => {
    const asset = await readSingleImageFromInput(event, "thumbnail pasangan section pertama");
    if (asset) {
      setOpeningThumbnailImage(asset);
    }
  };

  const handleUploadBridePhoto = async (event) => {
    const asset = await readSingleImageFromInput(event, "foto mempelai wanita");
    if (asset) {
      setBride((prev) => ({ ...prev, photo: asset }));
    }
  };

  const handleUploadGroomPhoto = async (event) => {
    const asset = await readSingleImageFromInput(event, "foto mempelai pria");
    if (asset) {
      setGroom((prev) => ({ ...prev, photo: asset }));
    }
  };

  const handleUploadAkadCover = async (event) => {
    const asset = await readSingleImageFromInput(event, "cover akad");
    if (asset) {
      setAkad((prev) => ({ ...prev, coverImage: asset }));
    }
  };

  const handleUploadResepsiCover = async (event) => {
    const asset = await readSingleImageFromInput(event, "cover resepsi");
    if (asset) {
      setResepsi((prev) => ({ ...prev, coverImage: asset }));
    }
  };

  const handleUploadClosingBackground = async (event) => {
    const asset = await readSingleImageFromInput(event, "background penutup");
    if (asset) {
      setClosingBackgroundImage(asset);
    }
  };

  const handleUploadSaveTheDateBackground = async (event) => {
    const asset = await readSingleImageFromInput(event, "background save the date");
    if (asset) {
      setSaveTheDateBackgroundImage(asset);
    }
  };

  const handleUploadWishesBackground = async (event) => {
    const asset = await readSingleImageFromInput(event, "background wishes");
    if (asset) {
      setWishesBackgroundImage(asset);
    }
  };

  const handleUploadStoryPhoto = (storyIndex, label) => async (event) => {
    const asset = await readSingleImageFromInput(event, label);
    if (!asset) return;

    setStories((prev) => {
      const next = [...prev];
      while (next.length <= storyIndex) {
        next.push({
          id: Date.now() + next.length,
          title: "",
          description: "",
          date: "",
          photo: null,
        });
      }
      next[storyIndex] = { ...next[storyIndex], photo: asset };
      return next;
    });
  };

  const handleRemoveStoryPhoto = (storyIndex) => {
    setStories((prev) =>
      prev.map((story, index) => (index === storyIndex && story?.photo ? { ...story, photo: null } : story)),
    );
  };

  const handleSelectQuotePreset = (presetId, options = {}) => {
    const { preserveManualValues = false } = options;
    setQuotePresetId(presetId);

    if (presetId === "manual" || !presetId) {
      if (!preserveManualValues && !presetId) {
        setQuote("");
        setQuoteSource("");
      }
      return;
    }

    const preset = QUOTE_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    setQuote(preset.text?.id || "");
    setQuoteSource(preset.source?.id || "");
  };

  const handleUploadGallery = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const galleryLimit = selectedPackage?.limits?.galleryMax || 4;
    const remaining = Math.max(0, galleryLimit - galleryImages.length);
    if (remaining === 0) {
      showAlert("info", `Paket ${selectedPackage.tier} hanya mendukung ${galleryLimit} foto galeri.`);
      event.target.value = "";
      return;
    }
    const selected = files
      .filter((file) => file.type.startsWith("image/"))
      .filter((file) => file.size <= maxUploadBytes)
      .slice(0, remaining);
    const oversizedCount = files.filter((file) => file.type.startsWith("image/") && file.size > maxUploadBytes).length;
    if (oversizedCount > 0) {
      showAlert("error", `${oversizedCount} foto dilewati karena melebihi 5MB.`);
    }
    const prepared = await Promise.all(
      selected.map(async (file) => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        url: await readFileAsDataUrl(file),
      }))
    );
    setGalleryImages((prev) => [...prev, ...prepared]);
    if (files.length > remaining) {
      showAlert("info", `Hanya ${remaining} foto yang ditambahkan karena batas paket ${selectedPackage.tier} adalah ${galleryLimit} foto.`);
    }
    event.target.value = "";
  };

  const handleChangeMusicMode = (nextMode) => {
    if (nextMode === "upload" && !selectedPackage?.capabilities?.customMusic) {
      showAlert("info", "Upload musik hanya tersedia mulai paket PREMIUM.");
      return;
    }
    setMusicMode(nextMode);
    setIsMusicPlaying(false);
    if (musicPreviewRef.current) {
      musicPreviewRef.current.pause();
      musicPreviewRef.current.currentTime = 0;
    }
  };

  const handleUploadCustomMusic = async (event) => {
    if (!selectedPackage?.capabilities?.customMusic) {
      showAlert("info", "Upload musik hanya tersedia mulai paket PREMIUM.");
      event.target.value = "";
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const isMp3 = file.type === "audio/mpeg" || file.type === "audio/mp3" || file.name.toLowerCase().endsWith(".mp3");
    if (!isMp3) {
      showAlert("error", "File musik harus berformat MP3.");
      event.target.value = "";
      return;
    }
    if (file.size > maxUploadBytes) {
      showAlert("error", "Ukuran file musik maksimal 5MB.");
      event.target.value = "";
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setUploadedMusicFile({
      name: file.name,
      size: file.size,
      sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.type || "audio/mpeg",
      dataUrl,
    });
    setMusicMode("upload");
    setIsMusicPlaying(false);
    if (musicPreviewRef.current) {
      musicPreviewRef.current.pause();
      musicPreviewRef.current.currentTime = 0;
    }
    event.target.value = "";
  };

  const handleToggleMusicPreview = () => {
    if (musicMode !== "list") return;
    const previewUrl = selectedMusicTrack?.previewUrl;
    if (!previewUrl) {
      showAlert("info", "Preview lagu belum tersedia untuk track ini.");
      return;
    }

    if (!musicPreviewRef.current) {
      musicPreviewRef.current = new Audio(previewUrl);
      musicPreviewRef.current.addEventListener("ended", () => setIsMusicPlaying(false));
    }

    const audio = musicPreviewRef.current;
    if (audio.src !== new URL(previewUrl, window.location.origin).toString()) {
      audio.src = previewUrl;
      audio.currentTime = 0;
    }

    if (audio.paused) {
      audio.play().then(() => setIsMusicPlaying(true)).catch(() => showAlert("error", "Preview musik tidak dapat diputar."));
      return;
    }

    audio.pause();
    setIsMusicPlaying(false);
  };

  const handleBack = () => {
    if (isSubmitting) return;
    if (currentStep === 1) {
      confirmExitIfDirty().then((ok) => { if (ok) navigateTo("/"); });
      return;
    }
    setCurrentStep((prev) => prev - 1);
  };

  const handleCopyPayment = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      showAlert("success", "Nomor pembayaran berhasil disalin.");
    } catch {
      showAlert("error", "Gagal menyalin. Silakan salin manual.");
    }
  };

  const handlePreviewUndangan = () => {
    const route = selectedTheme?.templateRoute;
    if (!route) {
      showAlert("info", "Tema ini belum memiliki preview langsung. Hubungi admin untuk demo.");
      return;
    }
    try {
      const defaultSchema = getDefaultSchemaBySlug(selectedTheme?.slug);
      const normalizedGiftBankList = normalizeGiftBankList(giftBankList);
      const normalizedGiftShipping = normalizeGiftShipping(giftShipping);
      const schemaData = mapFormToInvitationSchema({
        groom, bride, akad, resepsi, isReceptionEnabled,
        frontCoverImage, coverImage, openingThumbnailImage, galleryImages, stories,
        quote, quoteSource, saveTheDateBackgroundImage, wishesBackgroundImage, closingBackgroundImage,
        giftInfo: {
          bankList: normalizedGiftBankList,
          shipping: normalizedGiftShipping,
        },
        selectedPackage,
        selectedTheme,
        musicMode,
        selectedMusicTrack,
        uploadedMusicFile,
        defaultSchema,
      });
      saveInvitationDraft(schemaData);
      window.open(toAppPath(`${route}?preview=1`), "_blank", "noopener");
    } catch (err) {
      console.error("handlePreviewUndangan failed", err);
      showAlert("error", "Gagal memuat preview. Coba lagi.");
    }
  };

  const scrollToValidationTarget = (selector, shouldFocus = true) => {
    if (!selector) return;
    const container = contentRef.current;
    const target = container?.querySelector(selector) || document.querySelector(selector);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    if (shouldFocus && typeof target.focus === "function") {
      window.setTimeout(() => target.focus({ preventScroll: true }), 250);
    }
  };

  const getValidationIssue = () => {
    if (currentStep === 1) {
      if (!selectedTheme) return { message: "Tema belum siap. Tunggu data katalog selesai dimuat.", selector: null, shouldFocus: false };
      if (!customer.name) return { message: "Nama customer wajib diisi.", selector: "#customer_name" };
      if (!customer.phone) return { message: "No HP / WA wajib diisi.", selector: "#customer_phone" };
      if (!isValidPhoneNumber(customer.phone)) return { message: "Format No HP / WA tidak valid.", selector: "#customer_phone" };
      if (!customer.email) return { message: "Email wajib diisi.", selector: "#customer_email" };
      if (!isValidEmail(customer.email)) return { message: "Format email tidak valid.", selector: "#customer_email" };
      if (!groom.fullname) return { message: "Nama mempelai pria wajib diisi.", selector: "#groom_fullname" };
      if (!bride.fullname) return { message: "Nama mempelai wanita wajib diisi.", selector: "#bride_fullname" };
      return null;
    }
    if (currentStep === 2) {
      if (!akad.date) return { message: "Tanggal akad wajib diisi.", selector: "#akad_date" };
      if (!akad.startTime) return { message: "Jam mulai akad wajib diisi.", selector: "#akad_start_time" };
      if (!akad.endTime) return { message: "Jam selesai akad wajib diisi.", selector: "#akad_end_time" };
      if (!isEndTimeAfterStart(akad.startTime, akad.endTime)) {
        return { message: "Jam selesai akad harus lebih besar dari jam mulai.", selector: "#akad_end_time" };
      }
      if (!akad.venue) return { message: "Lokasi akad wajib diisi.", selector: "#akad_venue" };

      if (!resepsi.date) return { message: "Tanggal resepsi wajib diisi.", selector: "#resepsi_date" };
      if (!resepsi.startTime) return { message: "Jam mulai resepsi wajib diisi.", selector: "#resepsi_start_time" };
      if (!resepsi.endTime) return { message: "Jam selesai resepsi wajib diisi.", selector: "#resepsi_end_time" };
      if (!isEndTimeAfterStart(resepsi.startTime, resepsi.endTime)) {
        return { message: "Jam selesai resepsi harus lebih besar dari jam mulai.", selector: "#resepsi_end_time" };
      }
      if (!resepsi.venue) return { message: "Lokasi resepsi wajib diisi.", selector: "#resepsi_venue" };

      if (isSessionEnabled) {
        const invalidSession = sessions.find((session) => !session.start || !session.end);
        if (invalidSession && !invalidSession.start) {
          return {
            message: "Jam mulai pada sesi resepsi belum diisi.",
            selector: `[data-session-field="start-${invalidSession.id}"]`,
          };
        }
        if (invalidSession && !invalidSession.end) {
          return {
            message: "Jam selesai pada sesi resepsi belum diisi.",
            selector: `[data-session-field="end-${invalidSession.id}"]`,
          };
        }
        const invalidRangeSession = sessions.find((session) => !isEndTimeAfterStart(session.start, session.end));
        if (invalidRangeSession) {
          return {
            message: "Jam selesai pada sesi resepsi harus lebih besar dari jam mulai.",
            selector: `[data-session-field="end-${invalidRangeSession.id}"]`,
          };
        }
      }
      return null;
    }
    if (currentStep === 3) {
      const singleCoverFlow = usesSingleCoverFlow(uploadConfig);
      if (uploadConfig.cover?.required && !coverImage) {
        return {
          message: "Mohon upload cover dalam desktop terlebih dahulu.",
          selector: "#after_open_desktop_upload_section",
          shouldFocus: false,
        };
      }
      if (uploadConfig.openingThumbnail?.required && !openingThumbnailImage) {
        return {
          message: "Mohon upload thumbnail pasangan section pertama terlebih dahulu.",
          selector: "#opening_thumbnail_upload_section",
          shouldFocus: false,
        };
      }
      if (uploadConfig.frontCover?.required && !frontCoverImage) {
        return {
          message: singleCoverFlow
            ? "Mohon upload foto cover utama terlebih dahulu."
            : "Mohon upload foto cover depan terlebih dahulu.",
          selector: "#cover_upload_section",
          shouldFocus: false,
        };
      }
      if (!quote.trim()) {
        return {
          message: "Ayat atau quote pada Step 3 wajib diisi.",
          selector: "#quote_text",
        };
      }
      if (!quoteSource.trim()) {
        return {
          message: "Sumber ayat atau quote pada Step 3 wajib diisi.",
          selector: "#quote_source",
        };
      }

      const uploadValidationChecks = [
        {
          visible: uploadConfig.bridePhoto?.required,
          value: bride.photo,
          message: "Mohon upload foto mempelai wanita terlebih dahulu.",
          selector: "#bride_photo_upload_section",
        },
        {
          visible: uploadConfig.groomPhoto?.required,
          value: groom.photo,
          message: "Mohon upload foto mempelai pria terlebih dahulu.",
          selector: "#groom_photo_upload_section",
        },
        {
          visible: uploadConfig.akadCover?.required,
          value: akad.coverImage,
          message: "Mohon upload cover akad terlebih dahulu.",
          selector: "#akad_cover_upload_section",
          shouldFocus: false,
        },
        {
          visible: isReceptionEnabled && uploadConfig.resepsiCover?.required,
          value: resepsi.coverImage,
          message: "Mohon upload cover resepsi terlebih dahulu.",
          selector: "#resepsi_cover_upload_section",
          shouldFocus: false,
        },
        {
          visible: uploadConfig.closingBackground?.required,
          value: closingBackgroundImage,
          message: "Mohon upload background penutup terlebih dahulu.",
          selector: "#closing_background_upload_section",
          shouldFocus: false,
        },
        {
          visible: uploadConfig.openingThumbnail?.required,
          value: openingThumbnailImage,
          message: "Mohon upload thumbnail pasangan section pertama terlebih dahulu.",
          selector: "#opening_thumbnail_upload_section",
          shouldFocus: false,
        },
        {
          visible: uploadConfig.saveTheDateBackground?.required,
          value: saveTheDateBackgroundImage,
          message: "Mohon upload background Save The Date terlebih dahulu.",
          selector: "#save_the_date_background_upload_section",
          shouldFocus: false,
        },
        {
          visible: uploadConfig.wishesBackground?.required,
          value: wishesBackgroundImage,
          message: "Mohon upload background Wishes / Ucapan terlebih dahulu.",
          selector: "#wishes_background_upload_section",
          shouldFocus: false,
        },
        {
          visible: uploadConfig.loveStoryPhotoOne?.required,
          value: stories[0]?.photo,
          message: "Mohon upload thumbnail Love Story 1 terlebih dahulu.",
          selector: "#love_story_photo_one_upload_section",
          shouldFocus: false,
        },
        {
          visible: uploadConfig.loveStoryPhotoTwo?.required,
          value: stories[1]?.photo,
          message: "Mohon upload thumbnail Love Story 2 terlebih dahulu.",
          selector: "#love_story_photo_two_upload_section",
          shouldFocus: false,
        },
      ];

      const missingUpload = uploadValidationChecks.find((item) => item.visible && !item.value);
      if (missingUpload) {
        return missingUpload;
      }

      if (galleryImages.length === 0) {
        return {
          message: "Galeri prewedding pada Step 3 wajib diisi minimal 1 foto.",
          selector: "#gallery_upload_section",
          shouldFocus: false,
        };
      }

      if (selectedPackage?.capabilities?.loveStory) {
        const invalidStory = stories.find((story) => !story.title.trim() || !story.description.trim() || !story.date.trim());
        if (invalidStory && !invalidStory.title.trim()) {
          return {
            message: "Judul setiap Love Story wajib diisi.",
            selector: `[data-story-title="${invalidStory.id}"]`,
          };
        }
        if (invalidStory && !invalidStory.description.trim()) {
          return {
            message: "Deskripsi setiap Love Story wajib diisi.",
            selector: `[data-story-description="${invalidStory.id}"]`,
          };
        }
        if (invalidStory && !invalidStory.date.trim()) {
          return {
            message: "Tanggal atau tahun setiap Love Story wajib diisi.",
            selector: `[data-story-date="${invalidStory.id}"]`,
          };
        }
      }

      if (musicMode === "upload" && !uploadedMusicFile) {
        return {
          message: "Silakan upload file musik MP3 atau pilih mode list musik.",
          selector: "#music_upload_input",
        };
      }
      return null;
    }
    return null;
  };

  const handleNext = async () => {
    if (isSubmitting) return;

    const validationIssue = getValidationIssue();
    if (validationIssue) {
      showAlert("error", validationIssue.message || "Mohon lengkapi data wajib di langkah ini terlebih dahulu.");
      scrollToValidationTarget(validationIssue.selector, validationIssue.shouldFocus !== false);
      return;
    }
    setFormAlert(null);

    if (currentStep < 4) {
      setHasSubmitFailed(false);
      setCurrentStep((prev) => prev + 1);
      return;
    }

    setIsSubmitting(true);
    setHasSubmitFailed(false);
    try {
      const orderId = draftOrderIdRef.current;
      const effectiveStories = selectedPackage?.capabilities?.loveStory ? stories : [];
      const normalizedGiftBankList = normalizeGiftBankList(giftBankList);
      const normalizedGiftShipping = normalizeGiftShipping(giftShipping);
      const shouldIncludeAkadCoverUpload = uploadConfig.akadCover?.visible;
      const shouldIncludeResepsiCoverUpload = uploadConfig.resepsiCover?.visible;
      const {
        uploadedFrontCover,
        uploadedCover,
        uploadedOpeningThumbnail,
        uploadedGroomPhoto,
        uploadedBridePhoto,
        uploadedAkadCover,
        uploadedResepsiCover,
        uploadedSaveTheDateBackground,
        uploadedWishesBackground,
        uploadedClosingBackground,
        uploadedGallery,
        uploadedStories,
        uploadedMusic,
      } = await prepareOrderAssetsForSubmission({
        orderId,
        frontCoverImage,
        coverImage,
        openingThumbnailImage,
        groomPhoto: groom.photo,
        bridePhoto: bride.photo,
        akadCoverImage: shouldIncludeAkadCoverUpload ? akad.coverImage : null,
        resepsiCoverImage: shouldIncludeResepsiCoverUpload && isReceptionEnabled ? resepsi.coverImage : null,
        saveTheDateBackgroundImage,
        wishesBackgroundImage,
        closingBackgroundImage,
        galleryImages,
        stories: effectiveStories,
        musicMode,
        uploadedMusicFile,
      });
      const payload = {
        orderId,
        customer,
        groom: {
          ...groom,
          photo: uploadedGroomPhoto,
        },
        bride: {
          ...bride,
          photo: uploadedBridePhoto,
        },
        akad: {
          ...akad,
          coverImage: shouldIncludeAkadCoverUpload ? uploadedAkadCover : null,
        },
        resepsi: isReceptionEnabled
          ? {
            ...resepsi,
            coverImage: shouldIncludeResepsiCoverUpload ? uploadedResepsiCover : null,
          }
          : null,
        isReceptionEnabled,
        sessions: isSessionEnabled ? sessions : [],
        frontCoverImage: uploadedFrontCover,
        coverImage: uploadedCover,
        openingThumbnailImage: uploadedOpeningThumbnail,
        saveTheDateBackgroundImage: uploadedSaveTheDateBackground,
        wishesBackgroundImage: uploadedWishesBackground,
        closingBackgroundImage: uploadedClosingBackground,
        quote,
        quoteSource,
        galleryImages: uploadedGallery,
        stories: uploadedStories,
        music: musicMode === "list"
          ? {
            mode: "list",
            trackId: selectedMusicTrack.id,
            trackLabel: selectedMusicTrack.label,
            previewUrl: selectedMusicTrack.previewUrl,
          }
          : {
            mode: "upload",
            file: uploadedMusic,
          },
        selectedTheme: {
          name: selectedTheme?.name || "",
          slug: selectedTheme?.slug || "",
          presetId: selectedTheme?.presetId || "",
          packageTier: selectedTheme?.packageTier || "BASIC",
        },
        gift: canUseDigitalEnvelope
          ? {
            bankList: normalizedGiftBankList,
            shipping: normalizedGiftShipping,
          }
          : {
            bankList: [],
            shipping: {},
          },
        selectedPackage,
      };

      const response = await submitOrder(payload);

      const confirmationPayload = {
        ...response,
        customerName: response?.customerName || customer.name,
        themeName: response?.themeName || selectedTheme?.name || "-",
        packageTier: response?.packageTier || selectedTheme?.packageTier || "BASIC",
        totalPrice: response?.totalPrice ?? selectedPackage.price,
      };

      try {
        window.localStorage.setItem(ORDER_CONFIRMATION_STORAGE_KEY, JSON.stringify(confirmationPayload));
      } catch {
        // Ignore storage write errors.
      }

      navigateTo(buildOrderConfirmationPath(confirmationPayload.orderId || orderId));
    } catch {
      showAlert("error", "Submit gagal. Periksa koneksi lalu coba lagi.");
      setHasSubmitFailed(true);
      setIsSubmitting(false);
    }
  };

  const progressWidth = currentStep === 1 ? "w-1/4" : currentStep === 2 ? "w-2/4" : currentStep === 3 ? "w-3/4" : "w-full";

  return (
    <main className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen selection:bg-primary selection:text-white px-3 sm:px-4 lg:px-6 py-3 sm:py-6">
      <div className="mx-auto w-full max-w-7xl grid grid-cols-1 xl:grid-cols-[minmax(0,1fr),340px] gap-5 lg:gap-6 items-start">
        <div className="flex min-h-[calc(100vh-1.5rem)] sm:min-h-[calc(100vh-3rem)] min-h-0 w-full max-w-3xl xl:max-w-none mx-auto flex-col bg-white dark:bg-background-dark shadow-xl rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
          <header className="sticky top-0 z-30 bg-white dark:bg-background-dark/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between p-4">
              <button onClick={handleBack} className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Kembali">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="text-lg font-bold tracking-tight">Order Form</h1>
              <div className="size-10" />
            </div>

            <div className="w-full px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-4 left-0 h-[2px] w-full -translate-y-1/2 bg-slate-200 dark:bg-slate-700 z-0">
                  <div className={`h-full bg-primary transition-all duration-300 ${progressWidth}`}></div>
                </div>
                <StepItem index={1} label="Mempelai" currentStep={currentStep} />
                <StepItem index={2} label="Acara" currentStep={currentStep} />
                <StepItem index={3} label="Foto" currentStep={currentStep} />
                <StepItem index={4} label="Review" currentStep={currentStep} />
              </div>
            </div>
          </header>

          <section ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-5 pb-32 sm:pb-36 pt-6">
            {themesLoading && !selectedTheme && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Memuat tema dan paket dari API katalog...
              </div>
            )}
            {formAlert && (
              <div
                className={`mb-4 rounded-xl border px-4 py-3 flex items-start justify-between gap-3 ${formAlert.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : formAlert.type === "info"
                    ? "bg-sky-50 border-sky-200 text-sky-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                role="alert"
              >
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base">
                    {formAlert.type === "success" ? "check_circle" : formAlert.type === "info" ? "info" : "error"}
                  </span>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed">{formAlert.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormAlert(null)}
                  className="text-current/70 hover:text-current"
                  aria-label="Tutup notifikasi"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            )}

            {currentStep !== 1 && (
              <div className="mb-4 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Tema Dipilih</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedTheme?.name} <span className="text-xs text-slate-500">({selectedTheme?.packageTier})</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    confirmExitIfDirty().then((ok) => { if (ok) navigateTo("/tema"); });
                  }}
                  className="text-xs font-bold px-3 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary transition-colors"
                >
                  Ganti Tema
                </button>
              </div>
            )}

            {currentStep === 1 && (
              <StepOneMempelai
                customer={customer}
                setCustomer={setCustomer}
                groom={groom}
                setGroom={setGroom}
                bride={bride}
                setBride={setBride}
                selectedTheme={selectedTheme}
                availableThemes={availableThemes}
                onSelectTheme={setSelectedTheme}
              />
            )}
            {currentStep === 2 && (
              <StepTwoAcara
                akad={akad}
                setAkad={setAkad}
                resepsi={resepsi}
                setResepsi={setResepsi}
                isSessionEnabled={isSessionEnabled}
                setIsSessionEnabled={setIsSessionEnabled}
                sessions={sessions}
                addSession={addSession}
                removeSession={removeSession}
                updateSession={updateSession}
                packageConfig={selectedPackage}
                giftBankList={giftBankList}
                setGiftBankList={setGiftBankList}
                giftShipping={giftShipping}
                setGiftShipping={setGiftShipping}
              />
            )}
            {currentStep === 3 && (
              <StepThreeFoto
                coverImage={coverImage}
                frontCoverImage={frontCoverImage}
                openingThumbnailImage={openingThumbnailImage}
                groomPhoto={groom.photo}
                bridePhoto={bride.photo}
                akadCoverImage={akad.coverImage}
                resepsiCoverImage={resepsi.coverImage}
                saveTheDateBackgroundImage={saveTheDateBackgroundImage}
                wishesBackgroundImage={wishesBackgroundImage}
                closingBackgroundImage={closingBackgroundImage}
                galleryImages={galleryImages}
                quote={quote}
                quoteSource={quoteSource}
                quotePresetId={quotePresetId}
                setQuote={setQuote}
                setQuoteSource={setQuoteSource}
                onSelectQuotePreset={handleSelectQuotePreset}
                stories={stories}
                setStories={setStories}
                isReceptionEnabled={isReceptionEnabled}
                onUploadCover={handleUploadCover}
                onUploadOpeningThumbnail={handleUploadOpeningThumbnail}
                onUploadFrontCover={handleUploadFrontCover}
                onUploadGroomPhoto={handleUploadGroomPhoto}
                onRemoveGroomPhoto={() => setGroom((prev) => ({ ...prev, photo: null }))}
                onUploadBridePhoto={handleUploadBridePhoto}
                onRemoveBridePhoto={() => setBride((prev) => ({ ...prev, photo: null }))}
                onUploadAkadCover={handleUploadAkadCover}
                onRemoveAkadCover={() => setAkad((prev) => ({ ...prev, coverImage: null }))}
                onUploadResepsiCover={handleUploadResepsiCover}
                onRemoveResepsiCover={() => setResepsi((prev) => ({ ...prev, coverImage: null }))}
                onUploadSaveTheDateBackground={handleUploadSaveTheDateBackground}
                onRemoveSaveTheDateBackground={() => setSaveTheDateBackgroundImage(null)}
                onUploadWishesBackground={handleUploadWishesBackground}
                onRemoveWishesBackground={() => setWishesBackgroundImage(null)}
                onUploadClosingBackground={handleUploadClosingBackground}
                onRemoveClosingBackground={() => setClosingBackgroundImage(null)}
                onUploadLoveStoryPhotoOne={handleUploadStoryPhoto(0, "thumbnail love story pertama")}
                onRemoveLoveStoryPhotoOne={() => handleRemoveStoryPhoto(0)}
                onUploadLoveStoryPhotoTwo={handleUploadStoryPhoto(1, "thumbnail love story kedua")}
                onRemoveLoveStoryPhotoTwo={() => handleRemoveStoryPhoto(1)}
                onRemoveCover={() => setCoverImage(null)}
                onRemoveOpeningThumbnail={() => setOpeningThumbnailImage(null)}
                onRemoveFrontCover={() => setFrontCoverImage(null)}
                onUploadGallery={handleUploadGallery}
                onRemoveGallery={(id) => setGalleryImages((prev) => prev.filter((img) => img.id !== id))}
                music={{
                  mode: musicMode,
                  selectedTrackId: selectedMusicTrackId,
                  selectedTrackLabel: selectedMusicTrack.label,
                  uploadedFile: uploadedMusicFile,
                  isPlaying: isMusicPlaying,
                }}
                packageConfig={selectedPackage}
                uploadConfig={uploadConfig}
                onChangeMusicMode={handleChangeMusicMode}
                onChangeMusicTrack={setSelectedMusicTrackId}
                onUploadCustomMusic={handleUploadCustomMusic}
                onToggleMusicPreview={handleToggleMusicPreview}
              />
            )}
            {currentStep === 4 && (
              <StepFourReview
                customer={customer}
                frontCoverImage={frontCoverImage}
                groom={groom}
                bride={bride}
                akad={akad}
                resepsi={resepsi}
                isSessionEnabled={isSessionEnabled}
                sessions={sessions}
                coverImage={coverImage}
                openingThumbnailImage={openingThumbnailImage}
                quote={quote}
                quoteSource={quoteSource}
                saveTheDateBackgroundImage={saveTheDateBackgroundImage}
                wishesBackgroundImage={wishesBackgroundImage}
                closingBackgroundImage={closingBackgroundImage}
                galleryImages={galleryImages}
                stories={stories}
                music={{
                  mode: musicMode,
                  selectedTrackLabel: selectedMusicTrack.label,
                  uploadedFile: uploadedMusicFile,
                }}
                giftBankList={giftBankList}
                giftShipping={giftShipping}
                selectedPackage={selectedPackage}
                uploadConfig={uploadConfig}
                onCopyPayment={handleCopyPayment}
              />
            )}
          </section>

          <footer className="shrink-0 w-full bg-white/95 dark:bg-background-dark/95 backdrop-blur border-t border-slate-100 dark:border-slate-800 p-4 pb-5 sm:pb-6 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {/* Preview undangan: visible on Step 3 & 4 when theme has a template route */}
            {(currentStep === 3 || currentStep === 4) && selectedTheme?.templateRoute && (
              <button
                type="button"
                onClick={handlePreviewUndangan}
                disabled={isSubmitting}
                className="w-full mb-3 flex items-center justify-center gap-2 rounded-full border border-primary/40 text-primary font-semibold py-2.5 text-sm hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <span className="material-symbols-outlined text-base">preview</span>
                Contoh Undangan
              </button>
            )}
            <div className="flex gap-3 sm:gap-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-bold py-3.5 sm:py-4 text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Kembali
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex-[2] rounded-full bg-primary hover:bg-pink-600 transition-colors text-white font-bold py-3.5 sm:py-4 text-sm sm:text-base shadow-lg shadow-primary/30 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Memproses..." : currentStep === 3 ? "Review & Submit" : currentStep === 4 ? "Submit & Buat Undangan" : "Selanjutnya"}
                {isSubmitting ? (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true"></span>
                ) : (
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                )}
              </button>
            </div>
            {currentStep === 4 && hasSubmitFailed && !isSubmitting && (
              <button
                type="button"
                onClick={handleNext}
                className="mt-3 w-full rounded-full border border-primary/40 text-primary font-semibold py-2.5 text-sm hover:bg-primary/5 transition-colors"
              >
                Coba Lagi
              </button>
            )}
          </footer>
        </div>

        <aside className="hidden xl:block sticky top-6">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-soft">
            <p className="text-xs uppercase tracking-wider font-bold text-primary mb-2">Tips Pengisian</p>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">
              {currentStep === 1 ? "Agar Undangan Cepat Siap" : currentStep === 2 ? "Lengkapi Detail Acara" : currentStep === 3 ? "Perkuat Visual Undangan" : "Final Check Pesanan"}
            </h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {tips.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCover} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" multiple onChange={handleUploadGallery} />

      {/* ── Confirmation Dialog (replaces window.confirm) ─────── */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => confirmDialog.onConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6"
            style={{ animation: "dialogSlideUp 0.22s ease-out" }}
          >
            <div className="flex items-start gap-3 mb-5">
              <span className="material-symbols-outlined text-amber-500 text-2xl mt-0.5">warning</span>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => confirmDialog.onConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => confirmDialog.onConfirm(true)}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors shadow-lg shadow-rose-500/25"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dialogSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
