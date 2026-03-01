import { useEffect, useMemo, useRef, useState } from "react";
import { navigateTo } from "../utils/navigation";
import { getThemeByPresetId, getThemeBySlug, themes } from "../data/themes";
import { ORDER_CONFIRMATION_STORAGE_KEY } from "../services/dummyOrderApi";
import { submitOrder } from "../services/orderApi";
import { saveInvitationDraft, mapFormToInvitationSchema } from "../services/invitationDataBridge";
import { getDefaultSchemaBySlug } from "../templates/basic/schemas";

const INITIAL_CUSTOMER = { name: "", phone: "", email: "", address: "" };
const INITIAL_GROOM = { fullname: "", nickname: "", parents: "", instagram: "" };
const INITIAL_BRIDE = { fullname: "", nickname: "", parents: "", instagram: "" };
const INITIAL_AKAD = { date: "", startTime: "", endTime: "", venue: "", address: "", mapsLink: "" };
const INITIAL_RESEPSI = { date: "", startTime: "", endTime: "", venue: "", address: "", mapsLink: "" };
const INITIAL_SESSIONS = [
  { id: 1, start: "10:00", end: "11:00" },
  { id: 2, start: "11:30", end: "12:30" },
];
const INITIAL_STORIES = [
  { id: 1, title: "Pertama Bertemu", description: "Kami bertemu pertama kali di acara kampus dan mulai saling mengenal.", date: "2019" },
  { id: 2, title: "Menjalin Asmara", description: "Setelah berteman lama, kami memutuskan melangkah lebih serius.", date: "2021" },
];
const MUSIC_TRACKS = [
  { id: "andmesh-cinta-luar-biasa", label: "Andmesh - Cinta Luar Biasa", previewUrl: "/audio/andmesh-cinta-luar-biasa.mp3" },
  { id: "novo-amor-anchor", label: "Novo Amor - Anchor", previewUrl: "/audio/novo-amor.mp3" },
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

function StepOneMempelai({
  customer,
  setCustomer,
  groom,
  setGroom,
  bride,
  setBride,
  selectedTheme,
  onSelectTheme,
}) {
  const handleInput = (setter, key) => (event) => setter((prev) => ({ ...prev, [key]: event.target.value }));
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [themeQuery, setThemeQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const filteredThemes = useMemo(() => {
    const keyword = themeQuery.trim().toLowerCase();
    if (!keyword) {
      return themes;
    }

    return themes.filter((theme) =>
      [theme.name, theme.category, theme.packageTier].join(" ").toLowerCase().includes(keyword)
    );
  }, [themeQuery]);
  const sortedThemes = useMemo(() => {
    const list = [...filteredThemes];
    const originalOrder = new Map(themes.map((theme, index) => [theme.slug, index]));
    const rankBySort = {
      popular: { BASIC: 0, PREMIUM: 1, EKSLUSIF: 2 },
      basic: { BASIC: 0, PREMIUM: 1, EKSLUSIF: 2 },
      premium: { PREMIUM: 0, BASIC: 1, EKSLUSIF: 2 },
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
  }, [filteredThemes, sortBy]);

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

function StepTwoAcara({ akad, setAkad, resepsi, setResepsi, isReceptionEnabled, setIsReceptionEnabled, sessions, addSession, removeSession, updateSession }) {
  const handleAkad = (key) => (e) => setAkad((prev) => ({ ...prev, [key]: e.target.value }));
  const handleResepsi = (key) => (e) => setResepsi((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Detail Acara</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Isi jadwal akad, lokasi, dan resepsi jika ada.</p>
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

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between mb-8">
        <div>
          <p className="text-base font-bold">Tambah Resepsi?</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Aktifkan jika ada acara resepsi</p>
        </div>
        <button type="button" onClick={() => setIsReceptionEnabled((prev) => !prev)} className={`relative h-8 w-14 rounded-full transition-colors ${isReceptionEnabled ? "bg-primary" : "bg-slate-200 dark:bg-white/20"}`}>
          <span className={`absolute left-[2px] top-[2px] h-7 w-7 rounded-full bg-white border border-slate-300 transition-transform duration-300 ${isReceptionEnabled ? "translate-x-6" : "translate-x-0"}`}></span>
        </button>
      </div>

      {isReceptionEnabled && (
        <section className="mb-8 space-y-5 rounded-lg border border-slate-100 dark:border-slate-800 p-5 bg-white dark:bg-slate-800/40">
          <h3 className="text-xl font-bold">Resepsi</h3>
          <input id="resepsi_date" className="w-full bg-surface-light dark:bg-white/5 rounded-lg h-14 px-4" type="date" value={resepsi.date} onChange={handleResepsi("date")} />
          <div className="grid grid-cols-2 gap-4">
            <input id="resepsi_start_time" className="w-full bg-surface-light dark:bg-white/5 rounded-lg h-14 px-4" type="time" value={resepsi.startTime} onChange={handleResepsi("startTime")} />
            <input id="resepsi_end_time" className="w-full bg-surface-light dark:bg-white/5 rounded-lg h-14 px-4" type="time" value={resepsi.endTime} onChange={handleResepsi("endTime")} />
          </div>
          <input id="resepsi_venue" className="w-full bg-surface-light dark:bg-white/5 rounded-lg h-14 px-4" placeholder="Tempat / Nama Lokasi" type="text" value={resepsi.venue} onChange={handleResepsi("venue")} />
          <textarea className="w-full bg-surface-light dark:bg-white/5 rounded-lg p-4 resize-none" rows={3} placeholder="Alamat Lengkap" value={resepsi.address} onChange={handleResepsi("address")} />

          <div className="pt-2">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <p className="text-sm font-semibold">Pembagian Sesi</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Atur jadwal resepsi menjadi beberapa sesi</p>
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
        </section>
      )}
    </>
  );
}

function StepThreeFoto({
  coverImage,
  galleryImages,
  stories,
  setStories,
  onUploadCover,
  onRemoveCover,
  onUploadGallery,
  onRemoveGallery,
  music,
  onChangeMusicMode,
  onChangeMusicTrack,
  onUploadCustomMusic,
  onToggleMusicPreview,
}) {

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Foto &amp; Cerita</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Upload foto terbaik dan tambahkan perjalanan cerita cinta kalian.</p>
      </div>

      <section id="cover_upload_section" className="space-y-4 mb-8">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="text-lg font-bold">Foto Sampul Undangan</h3>
          <span className="text-xs font-medium text-primary bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full">Wajib</span>
        </div>

        {coverImage ? (
          <div className="group relative w-full aspect-video rounded-lg overflow-hidden shadow-soft bg-surface-light dark:bg-surface-dark border border-primary/10">
            <img src={coverImage.url} alt={coverImage.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70"></div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{coverImage.name}</p>
                <p className="text-white/80 text-xs">{coverImage.sizeLabel}</p>
              </div>
              <label className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full p-2 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-xl">edit</span>
                <input type="file" accept="image/*" className="hidden" onChange={onUploadCover} />
              </label>
            </div>
            <button className="absolute top-3 right-3 bg-white/90 dark:bg-black/50 text-red-500 hover:text-red-600 rounded-full p-1.5 shadow-sm" type="button" onClick={onRemoveCover}>
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        ) : (
          <label className="w-full aspect-video rounded-lg border-2 border-dashed border-primary/30 bg-primary-50/50 dark:bg-primary-900/10 flex flex-col items-center justify-center gap-2 text-primary cursor-pointer hover:border-primary transition-colors">
            <span className="material-symbols-outlined text-3xl">upload</span>
            <span className="text-sm font-semibold">Upload Foto Sampul</span>
            <input type="file" accept="image/*" className="hidden" onChange={onUploadCover} />
          </label>
        )}

        <p className="text-xs text-slate-500 px-1 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">info</span>
          Format JPG/PNG, Max 5MB. Gunakan orientasi landscape.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="text-lg font-bold">Galeri Prewedding</h3>
          <span className="text-xs font-medium text-slate-500">{galleryImages.length}/6 Terupload</span>
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

          {galleryImages.length < 6 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-primary/30 hover:border-primary bg-primary-50/50 dark:bg-primary-900/10 flex flex-col items-center justify-center gap-1 text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-lg">add</span>
              </div>
              <span className="text-[10px] font-semibold">Tambah</span>
              <input type="file" accept="image/*" className="hidden" multiple onChange={onUploadGallery} />
            </label>
          )}

          {Array.from({ length: Math.max(0, 6 - galleryImages.length - 1) }).map((_, idx) => (
            <div key={idx} className="aspect-square rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-transparent flex items-center justify-center text-gray-300 dark:text-gray-700">
              <span className="material-symbols-outlined text-xl">image</span>
            </div>
          ))}
        </div>
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
        </div>
      </section>

      <section className="space-y-4 mb-8">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="text-lg font-bold">Cerita Cinta Kita</h3>
          <button type="button" className="text-xs font-semibold text-primary hover:text-primary-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Contoh
          </button>
        </div>

        <div className="space-y-6 relative pl-3">
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
                      className="text-xs bg-transparent border-none p-0 text-primary font-medium w-full focus:ring-0 placeholder:text-primary/60"
                      placeholder="Tahun / Tanggal (Opsional)"
                      value={story.date}
                      onChange={(e) =>
                        setStories((prev) => prev.map((item) => (item.id === story.id ? { ...item, date: e.target.value } : item)))
                      }
                    />
                    {index > 0 && (
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
                  { id: Date.now(), title: "", description: "", date: "" },
                ])
              }
              className="w-full py-3 border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center gap-2 text-primary text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Tambah Cerita Baru
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function StepFourReview({
  customer,
  groom,
  bride,
  akad,
  resepsi,
  isReceptionEnabled,
  coverImage,
  galleryImages,
  stories,
  music,
  onCopyPayment,
  selectedTheme,
  selectedPackage,
}) {
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
            {isReceptionEnabled && (
              <div className="grid gap-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700/50">
                <div><p className="text-xs text-slate-500">Tanggal Resepsi</p><p className="text-sm font-medium">{formatDateID(resepsi.date)}</p></div>
                <div><p className="text-xs text-slate-500">Waktu</p><p className="text-sm font-medium">{resepsi.startTime || "-"} - {resepsi.endTime || "-"} WIB</p></div>
                <div><p className="text-xs text-slate-500">Lokasi</p><p className="text-sm font-medium">{resepsi.venue || "-"}</p></div>
              </div>
            )}
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
            <div className="pt-4">
              <p className="text-xs text-slate-500 mb-2">Cover</p>
              <p className="text-sm font-medium">{coverImage?.name || "Belum upload"}</p>
            </div>
            <div className="pt-3">
              <p className="text-xs text-slate-500 mb-2">Galeri</p>
              <p className="text-sm font-medium">{galleryImages.length} foto</p>
            </div>
            <div className="pt-3">
              <p className="text-xs text-slate-500 mb-2">Cerita Cinta</p>
              <p className="text-sm font-medium">{stories.length} momen</p>
            </div>
            <div className="pt-3">
              <p className="text-xs text-slate-500 mb-2">Musik</p>
              <p className="text-sm font-medium">
                {music.mode === "list" ? `List: ${music.selectedTrackLabel}` : `Upload: ${music.uploadedFile?.name || "-"}`}
              </p>
            </div>
          </div>
        </details>
      </div>

      <div className="mt-4 bg-surface-light dark:bg-surface-dark rounded-lg p-5 border border-primary/10">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">account_balance_wallet</span>
          Metode Pembayaran
        </h4>

        <div className="space-y-3">
          <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-16 bg-white rounded flex items-center justify-center border border-slate-100 p-1"><div className="text-[10px] font-bold text-blue-800 tracking-tighter">BCA</div></div>
                <div>
                  <h5 className="font-bold text-sm">Bank BCA</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pengecekan Manual</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Nomor Rekening</p>
                <p className="text-lg font-mono font-bold tracking-wide">1234567890</p>
              </div>
              <button
                type="button"
                onClick={() => onCopyPayment("1234567890")}
                className="text-primary text-xs font-bold bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-600 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>Salin
              </button>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-16 bg-white rounded flex items-center justify-center border border-slate-100 p-1"><div className="text-[10px] font-bold text-blue-500 tracking-tighter">DANA</div></div>
                <div>
                  <h5 className="font-bold text-sm">E-Wallet DANA</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pengecekan Otomatis</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Nomor Telepon</p>
                <p className="text-lg font-mono font-bold tracking-wide">08123456789</p>
              </div>
              <button
                type="button"
                onClick={() => onCopyPayment("08123456789")}
                className="text-primary text-xs font-bold bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-600 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>Salin
              </button>
            </div>
          </article>
        </div>
      </div>

      <div className="mt-4 bg-primary/5 rounded-lg p-5 border border-primary/10 flex justify-between items-center">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Total Biaya</p>
          <div className="flex items-baseline gap-1">
            <span className="text-primary text-xl font-bold">{formatMoneyID(selectedPackage.price)}</span>
            <span className="text-slate-400 text-xs line-through">{formatMoneyID(selectedPackage.oldPrice)}</span>
          </div>
          <p className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit mt-1 font-medium">
            Paket {selectedTheme?.packageTier || "BASIC"} - {selectedPackage.discount}
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isReceptionEnabled, setIsReceptionEnabled] = useState(false);
  const [formAlert, setFormAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitFailed, setHasSubmitFailed] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const contentRef = useRef(null);

  const [customer, setCustomer] = useState(INITIAL_CUSTOMER);
  const [groom, setGroom] = useState(INITIAL_GROOM);
  const [bride, setBride] = useState(INITIAL_BRIDE);

  const [akad, setAkad] = useState(INITIAL_AKAD);
  const [resepsi, setResepsi] = useState(INITIAL_RESEPSI);

  const [sessions, setSessions] = useState(INITIAL_SESSIONS);

  const [coverImage, setCoverImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [stories, setStories] = useState(INITIAL_STORIES);
  const [musicMode, setMusicMode] = useState("list");
  const [selectedMusicTrackId, setSelectedMusicTrackId] = useState(MUSIC_TRACKS[0].id);
  const [uploadedMusicFile, setUploadedMusicFile] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const musicPreviewRef = useRef(null);
  const getInitialTheme = () => {
    const params = new URLSearchParams(window.location.search);
    const themeSlug = params.get("theme");
    const presetId = params.get("preset_id");
    const packageTier = params.get("package");

    if (themeSlug) {
      const bySlug = getThemeBySlug(themeSlug);
      if (bySlug) return bySlug;
    }
    if (presetId) {
      const byPreset = getThemeByPresetId(presetId);
      if (byPreset) return byPreset;
    }
    if (packageTier) {
      const byPackage = themes.find((theme) => theme.packageTier === packageTier);
      if (byPackage) return byPackage;
    }

    return themes.find((theme) => theme.packageTier === "BASIC") || themes[0];
  };
  const [selectedTheme, setSelectedTheme] = useState(getInitialTheme);
  const selectedPackage = useMemo(() => {
    const pricingMap = {
      BASIC: { price: 50000, oldPrice: 110000, discount: "55% OFF" },
      PREMIUM: { price: 110000, oldPrice: 250000, discount: "56% OFF" },
      EKSLUSIF: { price: 180000, oldPrice: 400000, discount: "55% OFF" },
    };
    return pricingMap[selectedTheme?.packageTier] || pricingMap.BASIC;
  }, [selectedTheme?.packageTier]);
  const selectedMusicTrack = useMemo(
    () => MUSIC_TRACKS.find((track) => track.id === selectedMusicTrackId) || MUSIC_TRACKS[0],
    [selectedMusicTrackId],
  );
  const maxUploadBytes = 5 * 1024 * 1024;
  const isFormDirty = useMemo(() => {
    const hasCustomer = Boolean(customer.name || customer.phone || customer.email || customer.address);
    const hasCouple = Boolean(groom.fullname || groom.nickname || groom.parents || groom.instagram || bride.fullname || bride.nickname || bride.parents || bride.instagram);
    const hasAcara = Boolean(akad.date || akad.startTime || akad.endTime || akad.venue || akad.address || akad.mapsLink);
    const hasResepsi = Boolean(
      isReceptionEnabled || resepsi.date || resepsi.startTime || resepsi.endTime || resepsi.venue || resepsi.address || resepsi.mapsLink
    );
    const hasMedia = Boolean(coverImage || galleryImages.length > 0 || stories.some((story) => story.title || story.description || story.date));
    const hasMusic = Boolean(musicMode === "upload" || uploadedMusicFile || selectedMusicTrackId !== MUSIC_TRACKS[0].id);
    return currentStep > 1 || hasCustomer || hasCouple || hasAcara || hasResepsi || hasMedia || hasMusic;
  }, [
    currentStep,
    customer,
    groom,
    bride,
    akad,
    isReceptionEnabled,
    resepsi,
    coverImage,
    galleryImages.length,
    stories,
    musicMode,
    uploadedMusicFile,
    selectedMusicTrackId,
  ]);

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
      return ["Isi tanggal, jam, dan alamat acara dengan detail.", "Tempel link Google Maps agar tamu tidak tersesat.", "Aktifkan resepsi jika acaranya terpisah.", "Gunakan sesi bila ada pembagian jam tamu."];
    }
    if (currentStep === 3) {
      return ["Pilih cover landscape agar hasil lebih menarik.", "Upload foto prewedding yang resolusinya bagus.", "Tulis cerita cinta singkat dan mudah dibaca.", "Tambahkan 2-4 momen utama agar tidak terlalu panjang."];
    }
    if (currentStep === 4) {
      return ["Periksa kembali nama mempelai dan orang tua.", "Pastikan jadwal acara sudah benar.", "Lihat ulang galeri dan cerita cinta.", "Jika semua benar, lanjut submit pesanan."];
    }
    return ["Gunakan nama lengkap sesuai identitas.", "Isi nama orang tua sesuai format undangan.", "Akun Instagram opsional, bisa dikosongkan.", "Klik Selanjutnya untuk lanjut ke data acara."];
  }, [currentStep]);

  const addSession = () => setSessions((prev) => [...prev, { id: Date.now(), start: "13:00", end: "14:00" }]);
  const removeSession = (id) => setSessions((prev) => prev.filter((session) => session.id !== id));
  const updateSession = (id, key, value) => setSessions((prev) => prev.map((session) => (session.id === id ? { ...session, [key]: value } : session)));

  const handleUploadCover = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > maxUploadBytes) {
      showAlert("error", "Ukuran foto sampul maksimal 5MB.");
      event.target.value = "";
      return;
    }
    const url = await readFileAsDataUrl(file);
    setCoverImage({
      name: file.name,
      sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      url,
    });
    event.target.value = "";
  };

  const handleUploadGallery = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const remaining = Math.max(0, 6 - galleryImages.length);
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
        sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        url: await readFileAsDataUrl(file),
      }))
    );
    setGalleryImages((prev) => [...prev, ...prepared]);
    event.target.value = "";
  };

  const handleChangeMusicMode = (nextMode) => {
    setMusicMode(nextMode);
    setIsMusicPlaying(false);
    if (musicPreviewRef.current) {
      musicPreviewRef.current.pause();
      musicPreviewRef.current.currentTime = 0;
    }
  };

  const handleUploadCustomMusic = async (event) => {
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
      const schemaData = mapFormToInvitationSchema({
        groom, bride, akad, resepsi, isReceptionEnabled,
        coverImage, galleryImages, stories,
        defaultSchema,
      });
      saveInvitationDraft(schemaData);
      window.open(`${route}?preview=1`, "_blank", "noopener");
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

      if (!isReceptionEnabled) return null;
      if (!resepsi.date) return { message: "Tanggal resepsi wajib diisi.", selector: "#resepsi_date" };
      if (!resepsi.startTime) return { message: "Jam mulai resepsi wajib diisi.", selector: "#resepsi_start_time" };
      if (!resepsi.endTime) return { message: "Jam selesai resepsi wajib diisi.", selector: "#resepsi_end_time" };
      if (!isEndTimeAfterStart(resepsi.startTime, resepsi.endTime)) {
        return { message: "Jam selesai resepsi harus lebih besar dari jam mulai.", selector: "#resepsi_end_time" };
      }
      if (!resepsi.venue) return { message: "Lokasi resepsi wajib diisi.", selector: "#resepsi_venue" };

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
      return null;
    }
    if (currentStep === 3) {
      if (!coverImage) {
        return {
          message: "Mohon upload foto sampul terlebih dahulu.",
          selector: "#cover_upload_section",
          shouldFocus: false,
        };
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
      const payload = {
        customer,
        groom,
        bride,
        akad,
        resepsi: isReceptionEnabled ? resepsi : null,
        isReceptionEnabled,
        sessions: isReceptionEnabled ? sessions : [],
        coverImage,
        galleryImages,
        stories,
        music: musicMode === "list"
          ? {
            mode: "list",
            trackId: selectedMusicTrack.id,
            trackLabel: selectedMusicTrack.label,
          }
          : {
            mode: "upload",
            file: uploadedMusicFile,
          },
        selectedTheme: {
          name: selectedTheme?.name || "",
          slug: selectedTheme?.slug || "",
          presetId: selectedTheme?.presetId || "",
          packageTier: selectedTheme?.packageTier || "BASIC",
        },
        selectedPackage,
      };

      const response = await submitOrder(payload);

      const confirmationPayload = {
        ...response,
        customerName: customer.name,
        themeName: selectedTheme?.name || "-",
        packageTier: selectedTheme?.packageTier || "BASIC",
        totalPrice: selectedPackage.price,
      };

      try {
        window.localStorage.setItem(ORDER_CONFIRMATION_STORAGE_KEY, JSON.stringify(confirmationPayload));
      } catch {
        // Ignore storage write errors.
      }

      navigateTo("/konfirmasi-order");
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
        <div className="flex min-h-[calc(100vh-1.5rem)] sm:min-h-[calc(100vh-3rem)] w-full max-w-3xl xl:max-w-none mx-auto flex-col bg-white dark:bg-background-dark shadow-xl rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
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

          <section ref={contentRef} className="flex-1 overflow-y-auto px-4 sm:px-5 pb-24 pt-6">
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
                onSelectTheme={setSelectedTheme}
              />
            )}
            {currentStep === 2 && (
              <StepTwoAcara
                akad={akad}
                setAkad={setAkad}
                resepsi={resepsi}
                setResepsi={setResepsi}
                isReceptionEnabled={isReceptionEnabled}
                setIsReceptionEnabled={setIsReceptionEnabled}
                sessions={sessions}
                addSession={addSession}
                removeSession={removeSession}
                updateSession={updateSession}
              />
            )}
            {currentStep === 3 && (
              <StepThreeFoto
                coverImage={coverImage}
                galleryImages={galleryImages}
                stories={stories}
                setStories={setStories}
                onUploadCover={handleUploadCover}
                onRemoveCover={() => setCoverImage(null)}
                onUploadGallery={handleUploadGallery}
                onRemoveGallery={(id) => setGalleryImages((prev) => prev.filter((img) => img.id !== id))}
                music={{
                  mode: musicMode,
                  selectedTrackId: selectedMusicTrackId,
                  selectedTrackLabel: selectedMusicTrack.label,
                  uploadedFile: uploadedMusicFile,
                  isPlaying: isMusicPlaying,
                }}
                onChangeMusicMode={handleChangeMusicMode}
                onChangeMusicTrack={setSelectedMusicTrackId}
                onUploadCustomMusic={handleUploadCustomMusic}
                onToggleMusicPreview={handleToggleMusicPreview}
              />
            )}
            {currentStep === 4 && (
              <StepFourReview
                customer={customer}
                groom={groom}
                bride={bride}
                akad={akad}
                resepsi={resepsi}
                isReceptionEnabled={isReceptionEnabled}
                coverImage={coverImage}
                galleryImages={galleryImages}
                stories={stories}
                music={{
                  mode: musicMode,
                  selectedTrackLabel: selectedMusicTrack.label,
                  uploadedFile: uploadedMusicFile,
                }}
                selectedTheme={selectedTheme}
                selectedPackage={selectedPackage}
                onCopyPayment={handleCopyPayment}
              />
            )}
          </section>

          <footer className="sticky bottom-0 w-full bg-white/95 dark:bg-background-dark/95 backdrop-blur border-t border-slate-100 dark:border-slate-800 p-4 pb-5 sm:pb-6 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {/* Preview undangan: visible on Step 3 & 4 when theme has a template route */}
            {(currentStep === 3 || currentStep === 4) && selectedTheme?.templateRoute && (
              <button
                type="button"
                onClick={handlePreviewUndangan}
                className="w-full mb-3 flex items-center justify-center gap-2 rounded-full border border-primary/40 text-primary font-semibold py-2.5 text-sm hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-base">preview</span>
                Preview Undangan Langsung
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
