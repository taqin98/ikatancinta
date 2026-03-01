import { useEffect, useMemo, useState } from "react";
import { themes } from "../data/themes";
import Footer from "./Footer";
import Navbar from "./Navbar";
import WhatsAppButton from "./WhatsAppButton";
import { navigateTo, openInNewTab } from "../utils/navigation";

const categories = ["Semua", "Modern", "Minimalis", "Islami", "Floral", "Rustic"];
const INITIAL_VISIBLE = 8;
const LOAD_MORE_STEP = 4;

export default function ThemeGalleryPage() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const filteredThemes = useMemo(() => {
    if (activeCategory === "Semua") {
      return themes;
    }
    return themes.filter((theme) => theme.category === activeCategory);
  }, [activeCategory]);
  const visibleThemes = filteredThemes.slice(0, visibleCount);
  const hasMoreThemes = visibleCount < filteredThemes.length;

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [activeCategory]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_STEP, filteredThemes.length));
  };
  const getPreviewHref = (theme) => {
    if (theme.templateRoute) return theme.templateRoute;
    if (theme.packageTier === "PREMIUM") return `/preview-undangan-premium?preset_id=${theme.presetId}`;
    if (theme.packageTier === "EKSLUSIF") return `/preview-undangan-eksklusif?preset_id=${theme.presetId}`;
    return null; // No preview available for this theme yet
  };

  return (
    <>
      <Navbar />

      <main>
        <header className="pt-28 sm:pt-32 pb-8 px-4 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none opacity-50">
            <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h1 className="font-serif text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                Pilih Tema <span className="italic text-primary">Impianmu</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Temukan desain undangan yang paling mewakili kisah cintamu.
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-2 px-1 justify-start md:justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold active:scale-95 transition-all ${activeCategory === category
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                    : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="pb-16 sm:pb-20 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-8">
              {visibleThemes.map((theme) => (
                <div key={theme.name} className="group relative">
                  <div
                    className={`${theme.cardClass} dark:bg-slate-800 rounded-md p-3 sm:p-4 pb-4 sm:pb-5 transition-all duration-300 hover:shadow-xl`}
                  >
                    <div className="relative w-full aspect-[4/6] rounded-md overflow-hidden border border-white/60 shadow-soft transform group-hover:-translate-y-1 transition-transform duration-300 mb-4">
                      {theme.usePattern ? (
                        <div className="w-full h-full bg-slate-800 relative flex items-center justify-center overflow-hidden">
                          <div className="absolute inset-0 bg-emerald-900"></div>
                          <div className="absolute w-40 h-40 border border-amber-400/30 rotate-45"></div>
                          <div className="absolute w-32 h-32 border border-amber-400/50 rotate-45"></div>
                          <div className="absolute bottom-8 left-0 right-0 text-center text-white px-2">
                            <h3 className="font-serif italic text-xl mb-1 text-amber-200">
                              {theme.title}
                            </h3>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-amber-100">
                              {theme.couple}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="w-full h-full bg-cover bg-center"
                          style={{ backgroundImage: `url('${theme.image}')` }}
                        >
                          <div className={`absolute inset-0 ${theme.overlayClass}`}></div>
                          <div className="absolute bottom-8 left-0 right-0 text-center text-white px-2">
                            <h3 className="font-serif italic text-xl mb-1">{theme.title}</h3>
                            <p className="text-[10px] uppercase tracking-widest font-bold">
                              {theme.couple}
                            </p>
                          </div>
                        </div>
                      )}

                      <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-slate-900/80 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                        {theme.packageTier}
                      </span>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-white text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-100">
                          {theme.category}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                        {theme.name}
                      </h3>
                      {(() => {
                        const previewHref = getPreviewHref(theme);
                        return (
                          <div className={`grid gap-2 sm:gap-3 mt-4 ${previewHref ? "grid-cols-2" : "grid-cols-1"}`}>
                            {previewHref && (
                              <button
                                onClick={() => openInNewTab(previewHref)}
                                className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs sm:text-sm font-bold hover:border-slate-800 hover:text-slate-900 transition-colors flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                                Preview
                              </button>
                            )}
                            <button
                              onClick={() => navigateTo(`/buat-undangan?theme=${theme.slug}&preset_id=${theme.presetId}`)}
                              className="w-full py-2.5 rounded-xl bg-primary hover:bg-pink-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                              Pakai Desain Ini
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredThemes.length === 0 && (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400">
                Belum ada tema untuk kategori ini.
              </div>
            )}

            {hasMoreThemes && (
              <div className="mt-12 text-center">
                <button
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">refresh</span>
                  Muat Lebih Banyak
                </button>
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
