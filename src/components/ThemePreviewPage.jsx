import Footer from "./Footer";
import Navbar from "./Navbar";
import WhatsAppButton from "./WhatsAppButton";
import { navigateTo } from "../utils/navigation";
import { getThemeByPresetId } from "../data/themes";

function getPresetIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("preset_id") || "";
}

export default function ThemePreviewPage() {
  const presetId = getPresetIdFromUrl();
  const theme = getThemeByPresetId(presetId);

  if (!theme) {
    return (
      <>
        <Navbar />
        <main className="pt-28 pb-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-3">Preset tidak ditemukan</h1>
            <p className="text-slate-500 mb-6">Pastikan link preview yang kamu buka sudah benar.</p>
            <button
              onClick={(event) => {
                event.preventDefault();
                navigateTo("/tema");
              }}
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-3 rounded-full"
            >
              Kembali ke Galeri Tema
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const openInvitationLink = `https://wa.me/628567452717?text=${encodeURIComponent(
    `Halo Admin, saya mau pakai preset ${theme.name} (${theme.presetId}).`
  )}`;

  return (
    <>
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-16 sm:pb-20 px-4 bg-background-light dark:bg-background-dark min-h-screen">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
            <section className="w-full lg:w-[360px] lg:sticky lg:top-28">
              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 shadow-soft">
                <div className="relative w-full aspect-[9/19] rounded-[1.25rem] overflow-hidden bg-slate-900 border-[6px] border-slate-900">
                  <div className="absolute top-0 left-0 right-0 h-5 bg-slate-900 z-20 flex justify-center items-center">
                    <div className="w-16 h-3 bg-black rounded-b-xl"></div>
                  </div>
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${theme.thumbnail || theme.image}')` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  </div>
                  <div className="absolute bottom-7 left-0 right-0 text-center text-white px-3">
                    <p className="font-serif italic text-xl mb-1">{theme.title}</p>
                    <h3 className="text-[11px] uppercase tracking-[0.24em] font-bold">{theme.couple}</h3>
                    <button className="mt-3 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur border border-white/40 text-[11px] font-bold">
                      Buka Undangan
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <span className="px-2.5 py-1.5 rounded-lg bg-primary-soft text-primary text-[11px] font-bold text-center uppercase tracking-wide">
                    {theme.category}
                  </span>
                  <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold text-center uppercase tracking-wide">
                    {theme.packageTier}
                  </span>
                </div>
              </div>
            </section>

            <section className="flex-1 w-full">
              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 sm:p-6 shadow-soft">
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Preview Preset</p>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">{theme.name}</h1>
                <p className="text-slate-600 dark:text-slate-300 mb-4">{theme.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/40">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Preset ID</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white break-all">{theme.presetId}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/40">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Kategori</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{theme.category}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/40">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Paket</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{theme.packageTier}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <article className="rounded-2xl border border-slate-100 dark:border-slate-700 p-4 bg-primary-soft/60 dark:bg-slate-900/40">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">RSVP</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Tamu bisa konfirmasi hadir langsung dari undangan.</p>
                  </article>
                  <article className="rounded-2xl border border-slate-100 dark:border-slate-700 p-4 bg-secondary-soft/70 dark:bg-slate-900/40">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Navigasi Lokasi</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Arah ke lokasi acara otomatis dengan integrasi maps.</p>
                  </article>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={(event) => {
                      event.preventDefault();
                      navigateTo("/tema");
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:border-slate-900 hover:text-slate-900 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Kembali ke Galeri
                  </button>
                  <a
                    href={openInvitationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-pink-600 text-white font-bold shadow-lg shadow-primary/25 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">shopping_bag</span>
                    Pakai Preset Ini
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  );
}
