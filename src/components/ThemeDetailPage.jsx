import Footer from "./Footer";
import Navbar from "./Navbar";
import WhatsAppButton from "./WhatsAppButton";
import { navigateTo, openInNewTab } from "../utils/navigation";
import { getThemeBySlug, invitationsByTheme } from "../data/themes";
import { getCurrentPathname } from "../utils/navigation";

export default function ThemeDetailPage() {
  const pathname = getCurrentPathname();
  const slug = pathname.slice("/tema/".length);
  const theme = getThemeBySlug(slug);

  if (!theme) {
    return (
      <>
        <Navbar />
        <main className="pt-24 sm:pt-32 pb-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-3">Tema tidak ditemukan</h1>
            <button
              onClick={(event) => {
                event.preventDefault();
                navigateTo("/tema");
              }}
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-3 rounded-full"
            >
              Kembali ke Galeri
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const getPreviewPathByPackageTier = (packageTier) => {
    if (packageTier === "PREMIUM") return "/preview-undangan-premium";
    if (packageTier === "EKSLUSIF") return "/preview-undangan-eksklusif";
    return null;
  };

  const invitationsUsingPreset = invitationsByTheme[theme.slug] || [];
  const previewBackground = theme.thumbnail || theme.image;
  // templateRoute is required for new templates; fall back to tier-based path for legacy PREMIUM/EKSLUSIF
  const legacyPath = getPreviewPathByPackageTier(theme.packageTier);
  const previewHref = theme.templateRoute
    ? theme.templateRoute
    : legacyPath
      ? `${legacyPath}?preset_id=${theme.presetId}`
      : null;

  return (
    <>
      <Navbar />
      <main>
        <section className="pt-20 sm:pt-24 lg:pt-28 pb-6 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-6 lg:gap-8 items-start">
              <div className="rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 lg:p-5 max-w-[340px] mx-auto w-full">
                <div className="w-full aspect-[4/6] rounded-[1.25rem] overflow-hidden bg-slate-200">
                  <img src={previewBackground} alt={`Thumbnail tema ${theme.name}`} className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="max-w-xl mx-auto lg:mx-0">
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">{theme.category}</p>
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-3 leading-tight">
                  {theme.name}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{theme.description}</p>
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-primary-soft text-primary px-3 py-1.5 rounded-full mb-5">
                  Masuk Paket {theme.packageTier}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  {previewHref && (
                    <button
                      onClick={(event) => {
                        event.preventDefault();
                        openInNewTab(previewHref);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm sm:text-base font-bold hover:border-slate-900 hover:text-slate-900 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      Preview
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigateTo(`/buat-undangan?theme=${theme.slug}&preset_id=${theme.presetId}`)}
                    className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl bg-primary hover:bg-pink-600 text-white text-sm sm:text-base font-bold text-center leading-tight shadow-lg shadow-primary/25 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">shopping_bag</span>
                    Pakai Desain Ini
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                  <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Preset</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{theme.name}</p>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Kategori</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{theme.category}</p>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Paket</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{theme.packageTier}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Daftar undangan yang memakai desain {theme.name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Referensi undangan aktif dengan preset <span className="font-bold text-slate-700 dark:text-slate-200">{theme.name}</span>.
            </p>
            {invitationsUsingPreset.length > 0 ? (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                {invitationsUsingPreset.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[1.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 hover:shadow-lg transition-shadow"
                  >
                    <div className="w-full aspect-[4/6] rounded-xl overflow-hidden bg-slate-200 mb-3">
                      <img src={item.thumbnail} alt={`Thumbnail ${item.title}`} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{item.date}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 py-10 text-center text-slate-500 dark:text-slate-300">
                Belum ada data undangan untuk preset ini.
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
