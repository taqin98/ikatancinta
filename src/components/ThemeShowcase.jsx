import { navigateTo, toAppPath } from "../utils/navigation";
import { themes } from "../data/themes";

export default function ThemeShowcase() {
  const handleSeeMore = (event) => {
    event.preventDefault();
    navigateTo("/tema");
  };

  return (
    <section className="py-16 sm:py-20 bg-background-light dark:bg-background-dark">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 animate-enter-up">
          <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block">
            Tema Populer
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Pilih Tema dan Bagikan Undanganmu Hari Ini
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Tanpa setup rumit. Langsung aktif dan bisa dibagikan ke WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 max-w-6xl mx-auto">
          {themes.map((theme, index) => (
            <article
              key={theme.name}
              onClick={() => navigateTo(`/tema/${theme.slug}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigateTo(`/tema/${theme.slug}`);
                }
              }}
              role="button"
              tabIndex={0}
              className="rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 hover:shadow-lg transition-shadow cursor-pointer animate-enter-up"
              style={{ transitionDelay: `${120 + index * 80}ms` }}
            >
              <div className="w-full aspect-[4/6] rounded-lg overflow-hidden bg-slate-200 mb-3">
                <img
                  src={theme.thumbnail}
                  alt={`Thumbnail tema ${theme.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                {theme.category}
              </p>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1">{theme.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-300">{theme.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={toAppPath("/tema")}
            onClick={handleSeeMore}
            className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm px-6 py-3 rounded-full hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Lihat Selengkapnya
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>
  );
}
