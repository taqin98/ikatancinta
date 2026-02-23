import { navigateTo } from "../utils/navigation";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const consultationLink = `https://wa.me/628567452717?text=${encodeURIComponent(
    "konsultasi undangan digital ikatancinta.in"
  )}`;

  const handleInternalNav = (event, href) => {
    event.preventDefault();
    setMobileOpen(false);
    navigateTo(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          <a
            href="/"
            onClick={(event) => handleInternalNav(event, "/")}
            className="flex-shrink-0 flex items-center gap-1.5 min-w-0"
          >
            <span className="material-symbols-outlined text-primary max-[390px]:text-[26px]" style={{ fontSize: 32 }}>
              favorite
            </span>
            <span className="font-serif font-bold text-lg sm:text-2xl tracking-tight text-slate-900 dark:text-white truncate max-[390px]:text-base">
              ikatancinta.in
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            <a
              className="text-sm font-semibold hover:text-primary transition-colors"
              href="/#fitur"
              onClick={(event) => handleInternalNav(event, "/#fitur")}
            >
              Fitur
            </a>
            <a
              className="text-sm font-semibold hover:text-primary transition-colors"
              href="/tema"
              onClick={(event) => handleInternalNav(event, "/tema")}
            >
              Tema
            </a>
            <a
              className="text-sm font-semibold hover:text-primary transition-colors"
              href="/#harga"
              onClick={(event) => handleInternalNav(event, "/#harga")}
            >
              Harga
            </a>
            <a
              className="text-sm font-semibold hover:text-primary transition-colors"
              href="/#testimoni"
              onClick={(event) => handleInternalNav(event, "/#testimoni")}
            >
              Testimoni
            </a>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <a
              href={consultationLink}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex text-sm font-bold text-slate-600 hover:text-slate-900 px-4 py-2"
            >
              Konsultasi
            </a>
            <button
              onClick={(event) => handleInternalNav(event, "/buat-undangan")}
              className="bg-primary hover:bg-pink-600 text-white text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2.5 rounded-full transition-all shadow-lg shadow-primary/30 active:scale-95 whitespace-nowrap"
            >
              <span className="max-[390px]:hidden">Buat Undangan</span>
              <span className="hidden max-[390px]:inline">Buat</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 text-slate-700 bg-white/80"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <span className="material-symbols-outlined text-xl">
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 animate-enter-up is-visible">
            <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-100 dark:border-slate-700 p-3">
              <a
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                href="/#fitur"
                onClick={(event) => handleInternalNav(event, "/#fitur")}
              >
                Fitur
              </a>
              <a
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                href="/tema"
                onClick={(event) => handleInternalNav(event, "/tema")}
              >
                Tema
              </a>
              <a
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                href="/#harga"
                onClick={(event) => handleInternalNav(event, "/#harga")}
              >
                Harga
              </a>
              <a
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                href="/#testimoni"
                onClick={(event) => handleInternalNav(event, "/#testimoni")}
              >
                Testimoni
              </a>
              <a
                href={consultationLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-center bg-slate-900 text-white text-sm font-bold px-4 py-2.5 rounded-xl"
                onClick={() => setMobileOpen(false)}
              >
                Konsultasi
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
