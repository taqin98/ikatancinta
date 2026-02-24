import { useEffect, useRef, useState } from "react";

const galleryImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCq5o2G6c8U43H69KadZyZ3qDZfA_DbIMYqgrAOMjuJ31b75f0jLCnjgpapNc7YhJeIDoX-k9fQkjKTAKuhXVBI7Y0OpRnTwbvQ7DGjjOXouZFftquGyOPii1WxRpIpNhBCO72RiNUb0VGwgxWM0Ek7tqeDgSGn56I1K1LmKcPclP28cHMhU7hnwf17pzNk_ukLSh2f1lKS9omJc8_8RGfM83DTYerzk-zpMTi54F4fSUcJgEqrVmca9d_AMRULHi6MKBB6CGlz9U8I",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuASbD0QZ2ogbKpWPyM1c6TDRemfrnh7bAQIy01S802LUJVhV_1uVFu7DIkGUBH8ugmeNoQhQ6xCgaeO-ZATPBqSsdfh6MOyR0bLIPSlcIVSgSuAdVlFHD-7LBND6kgxareEjZ7kQnuSfwOIw67IEY8FeKpMyS8g4_T_KtI6_QT96cesO9_IO7pSu6f7vSxTUhpC95todPoUN9qKaBDB7lYiC4EHTcaR8U_f5zAEsH5m7cFomLQ0YE56UbklF0mlx89pnBfMA5sqwAZC",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAQSQ_836cyL6XxKE54c2eQuFCVsuD0_YQRo_22tNpIXnhqQBUTmnMfxuuujHTXXIVNxV3xsKOa0qqFOAr8WEvEt77zyE4SXDcKGqiA5J7aBAqkqpi8T7Vhpz2onShLU6KgmxKLkuZY6fI8BOZ09P7pEqKkQEnAso7jM9lgcsdHLLWW8ySai_3kBZSIhl8Tl0dLRR07mhX01AIq594s8p9A0fkQzE1TNJUxznfakSllgWewDMkg-niAy9SFrXwy-XqxsDHaqyYMm3KR",
];

const albumArt = "https://i.scdn.co/image/ab67616d0000b273277620423172f5a151f452e3";
const musicBackgroundVideo = "/videos/novo-amor-anchor.mp4";

export default function Features() {
  const audioRef = useRef(null);
  const bgVideoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return undefined;
    }

    const updateTime = () => {
      if (!audio.duration) {
        setProgress(0);
        return;
      }
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const updateDuration = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    const bgVideo = bgVideoRef.current;
    if (!bgVideo) {
      return;
    }

    if (isPlaying) {
      bgVideo.play().catch(() => {});
      return;
    }

    bgVideo.pause();
  }, [isPlaying]);

  const toggleAudio = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <section id="fitur" className="py-16 sm:py-20 bg-background-light dark:bg-background-dark relative scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-enter-up">
          <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block">
            Fitur Lengkap
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Semua yang Kamu Butuhkan
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Kami menyediakan fitur premium untuk membuat undangan pernikahanmu
            semakin berkesan dan fungsional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-flow-dense gap-4 lg:gap-6 md:auto-rows-[240px] animate-enter-up anim-delay-1">
          <div className="md:col-span-2 md:row-span-2 rounded-[2rem] bg-[#f8f0f4] dark:bg-slate-800 p-5 sm:p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-primary/15 blur-3xl"></div>
            <div className="absolute -left-14 bottom-4 w-40 h-40 rounded-full bg-rose-300/25 blur-3xl"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="bg-white dark:bg-slate-700 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary">
                    collections
                  </span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-2 text-slate-900 dark:text-white">
                  Galeri Foto &amp; Video
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-sm">
                  Tampilkan momen prewedding terbaikmu dalam resolusi tinggi.
                  Slide otomatis yang memukau tamu undangan.
                </p>
              </div>
              <div className="w-full h-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg mt-4 overflow-hidden p-2 grid grid-cols-3 gap-2">
                {galleryImages.map((image) => (
                  <div
                    key={image}
                    className="bg-cover bg-center rounded-lg h-full"
                    style={{ backgroundImage: `url('${image}')` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-1 md:row-span-2 rounded-[2rem] bg-secondary-soft dark:bg-slate-800 p-5 sm:p-8 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl"></div>
            <div className="absolute inset-0">
              <video
                ref={bgVideoRef}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isPlaying ? "opacity-65" : "opacity-45"
                }`}
                muted
                loop
                playsInline
                preload="none"
                aria-hidden="true"
              >
                <source src={musicBackgroundVideo} type="video/mp4" />
              </video>
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: `url('${albumArt}')` }}
              ></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/20 to-white/55 dark:from-slate-900/10 dark:via-slate-900/35 dark:to-slate-900/55"></div>
            <div className="relative z-10 h-full flex flex-col">
              <div className="bg-white dark:bg-slate-700 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:rotate-12 transition-transform">
                <span className="material-symbols-outlined text-secondary text-2xl">
                  music_note
                </span>
              </div>
              <h3 className="font-serif text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                Musik Latar
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Pilih lagu favoritmu untuk menemani tamu saat membuka undangan.
              </p>
              <div className="mt-auto bg-white dark:bg-slate-700 p-4 rounded-3xl shadow-lg">
                <audio ref={audioRef} preload="metadata">
                  <source src="/audio/andmesh-cinta-luar-biasa.mp3" type="audio/mpeg" />
                </audio>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 bg-slate-200 rounded-full bg-cover"
                    style={{ backgroundImage: `url('${albumArt}')` }}
                  ></div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      Andmesh
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
                      Cinta Luar Biasa
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-[width] duration-200"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <button type="button" disabled aria-label="Track sebelumnya belum tersedia" className="opacity-50 cursor-not-allowed">
                    <span className="material-symbols-outlined text-sm">
                      skip_previous
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-pink-600 transition-colors"
                    aria-label={isPlaying ? "Pause music" : "Play music"}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isPlaying ? "pause" : "play_arrow"}
                    </span>
                  </button>
                  <button type="button" disabled aria-label="Track berikutnya belum tersedia" className="opacity-50 cursor-not-allowed">
                    <span className="material-symbols-outlined text-sm">
                      skip_next
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-2">
                  Durasi: {duration ? `${Math.round(duration)}s` : "--"} | Lagu latar contoh aktif.
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 sm:p-6 flex flex-col justify-between group hover:shadow-lg transition-shadow min-h-[180px] relative overflow-hidden">
              <div className="absolute inset-0">
                <svg viewBox="0 0 360 220" className="w-full h-full opacity-80 dark:opacity-35">
                  <rect width="360" height="220" fill="#d5d8d4" />
                  <path d="M0 35H220C240 35 255 50 255 70V78H0Z" fill="#9ad77b" />
                  <path d="M180 148H360V220H146C155 188 165 168 180 148Z" fill="#9ad77b" />
                  <path d="M0 88 C40 82, 88 94, 128 82 C170 70, 220 88, 260 80 C300 72, 334 80, 360 76" stroke="#77b8e8" strokeWidth="9" fill="none" />
                  <path d="M0 90 C40 84, 88 96, 128 84 C170 72, 220 90, 260 82 C300 74, 334 82, 360 78" stroke="#b9ddf6" strokeWidth="4" fill="none" />
                  <path d="M40 220 C70 188, 102 150, 156 124 C220 96, 285 86, 360 86" stroke="#f3cb4f" strokeWidth="22" fill="none" strokeLinecap="round" />
                  <path d="M0 144 C56 142, 100 138, 154 120 C212 101, 278 104, 360 116" stroke="#f3cb4f" strokeWidth="18" fill="none" strokeLinecap="round" />
                  <path d="M20 42 H202 C218 42 231 55 231 70V74" stroke="#ffffff" strokeWidth="11" fill="none" strokeLinecap="round" />
                  <path d="M232 70 H360" stroke="#ffffff" strokeWidth="11" fill="none" strokeLinecap="round" />
                  <path d="M198 220 C212 188, 238 165, 270 148 C300 131, 332 126, 360 126" stroke="#ffffff" strokeWidth="11" fill="none" strokeLinecap="round" />
                  <path d="M90 206 C112 181, 128 165, 146 146 C161 130, 178 120, 194 110" stroke="#2e7bea" strokeWidth="9" fill="none" strokeLinecap="round" />
                  <circle cx="90" cy="206" r="10" fill="#2e7bea" />
                  <circle cx="90" cy="206" r="15" fill="none" stroke="#ffffff" strokeWidth="3" />
                  <g transform="translate(232,76)" className="animate-pulse">
                    <path d="M0 0 C-10 0 -18 8 -18 18 C-18 31 -2 45 0 49 C2 45 18 31 18 18 C18 8 10 0 0 0 Z" fill="#ef4444" />
                    <circle cx="0" cy="18" r="6" fill="#ffffff" />
                  </g>
                </svg>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-white/35 dark:from-slate-800/95 dark:via-slate-800/70 dark:to-slate-800/40"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div className="bg-primary-soft w-10 h-10 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">near_me</span>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                  arrow_outward
                </span>
              </div>
              <div className="relative z-10">
                <h4 className="font-bold text-lg mb-1">Navigasi Peta</h4>
                <p className="text-xs text-slate-500">
                  Integrasi Google Maps akurat.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] bg-primary-soft/80 dark:bg-slate-800 dark:border-slate-700 p-5 sm:p-6 flex flex-col gap-4 group hover:shadow-lg transition-shadow min-h-[210px] relative overflow-hidden">
              <div className="absolute inset-0 opacity-80 dark:opacity-35">
                <img
                    src="/illustrations/gift-card-bg-03.svg"
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover"
                  />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/45 to-white/45 dark:from-slate-800/95 dark:via-slate-800/70 dark:to-slate-800/40"></div>

              <div className="relative z-10 flex justify-end items-start">
                {/* <div className="bg-white/90 w-10 h-10 rounded-xl flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined">card_giftcard</span>
                </div> */}
                <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">
                  arrow_outward
                </span>
              </div>

              

              <div className="relative z-10 mt-auto">
                <h4 className="font-bold text-lg mb-1 text-slate-900 dark:text-white">Amplop Digital</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">Terima hadiah via E-Wallet/QRIS.</p>
              </div>
            </div>

            <div className="rounded-[2rem] bg-slate-900 text-white p-5 sm:p-6 flex flex-col justify-between group relative overflow-hidden min-h-[180px] sm:col-span-2 lg:col-span-1">
              <div className="relative z-10 flex flex-col justify-center h-full">
                <h4 className="font-bold text-lg sm:text-xl mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    check_circle
                  </span>
                  RSVP Biasa
                </h4>
                <p className="text-sm text-slate-300 max-w-sm">
                  Tamu dapat mengisi konfirmasi kehadiran langsung dari undangan.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-semibold">
                    Tamu Hadir
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-semibold">
                    Konfirmasi Standar
                  </span>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl transform translate-x-10 translate-y-10"></div>
            </div>
          </div>

          <div className="md:col-span-3 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/80 dark:bg-surface-dark px-4 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-transform hover:-translate-y-0.5 cursor-default">
                <span className="material-symbols-outlined text-primary text-[20px]">palette</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Desain Kekinian</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Template modern dan elegan.</p>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-surface-dark px-4 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-transform hover:-translate-y-0.5 cursor-default">
                <span className="material-symbols-outlined text-primary text-[20px]">edit_note</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Buku Tamu</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Buat daftar tamu dengan sistem QR Card</p>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-surface-dark px-4 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-transform hover:-translate-y-0.5 cursor-default">
                <span className="material-symbols-outlined text-primary text-[20px]">favorite</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Love Stories</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Ceritakan perjalanan cintamu dengan leluasa.</p>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-surface-dark px-4 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-transform hover:-translate-y-0.5 cursor-default">
                <span className="material-symbols-outlined text-primary text-[20px]">live_tv</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Live Streaming</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Acara bisa ditonton dari mana saja.</p>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-surface-dark px-4 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-transform hover:-translate-y-0.5 cursor-default">
                <span className="material-symbols-outlined text-primary text-[20px]">person_add</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Bagikan Dengan Nama Tamu</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Bisa juga membuat share dengan nama Teman/Saudara/Keluarga agar lebih ekslusif.</p>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-surface-dark px-4 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-transform hover:-translate-y-0.5 cursor-default">
                <span className="material-symbols-outlined text-primary text-[20px]">ios_share</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Native Share</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Bagikan instan via fitur perangkat.</p>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-surface-dark px-4 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-transform hover:-translate-y-0.5 cursor-default">
                <span className="material-symbols-outlined text-primary text-[20px]">translate</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Multi Bahasa</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Pilih undangan kamu menggunakan bahasa indonesia/inggris.</p>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-surface-dark px-4 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-transform hover:-translate-y-0.5 cursor-default">
                <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Custom Time Zone</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Waktu acara sesuai zona tamu.</p>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-surface-dark px-4 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-transform hover:-translate-y-0.5 cursor-default">
                <span className="material-symbols-outlined text-primary text-[20px]">chat</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Quotes</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Pilih quote atau ayat dengan leluasa.</p>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-surface-dark px-4 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-transform hover:-translate-y-0.5 cursor-default">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_clock</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">Jadwal Unlimited</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Tambahkan banyak sesi acara sesuai kebutuhan.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
