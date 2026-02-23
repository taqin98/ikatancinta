import { navigateTo } from "../utils/navigation";

const avatars = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCdXpx2fUU55P5NHfSNsEfCkgpvQ2SspMdLxi3tgoLVeHhycG4N4Qc0o12JkJ81ehHNVQB6tMwyavDU2H8YUHnw4YygJacbCLppPtuwsFebDPHWknWzfc3EsIFdwG37Ak0ZAOSLzu2oaeKKfE0n6L7057Lm2v-fh9-ETXTbQ67qjW-QTGTDcVLSwK8tLgmAbeFjttXX0qYFbPZa9ozfUh6KigTQayeNHZ_HnuEtMRDzH4XWWF_tFFrhFecFssFM8rHFZnRbaRv6f-dF',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCQ7s29lBqTtj-qH09R6zZTcpfDKtZ7UvXGtrtbUYF_PMLSPfh6mwoZ3Dl47KGiwhHjmsHP3GKJeOB62xt9UZnl0dEqOWWDnnLb9Z0-Iz1pNRil3KlHHpAmZnirUqqsQNKIH1zMAbjcunB8xh1j3q-zxQoBiN96Z--5iW8zNvRBHYwtu4sqKUu-uAGZLqV23yvA5a3Hn72rhjb7sKa9rFvpZa2NfJUc5YZFcy473chHOVKaODZV_v0P4Dor372I_5KooHnWuegLZ0tZ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBE4GwGkBG3yN4u_lp2qsqqynZK2ADL7MhRkQer2PV7dP3VTRtt0LX7QU6YaLPlqWgk5gjw9uhEjQxxt6hpqQyxBho8LBeX1ULNqugFVwt5zny_VTtuvnyNLDeSMuGwouV0h4GDw2m7OzggkcGy6rxbcErsWEJbTrlfAXG5Vpn-XMHRXz4Cvg6P6vtDNY9xSJUJAfC1ac3ROAGeT51Xfe_ljkLIkZXlqgTDpUaDF64GVP__EoFqOjJA2DxuM-sYswwvsTKrcsBGJx7i',
];

const heroImages = {
    card1: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsflsl_adbn0oqqfiu9fjq3ItiJKrlPqU17VYLBEjZnri1tWHP-Yn5tnoYJ1f4pGjNEflgA4ETPg9zVoGGQCd27yCXhpIFdEzRLVLzdu6Bieotx9uIig3pLXnxTxWIeOW1OpP1rKCt4o3gVLdrLUShKnyOOAhPrmLtbDxnwie8ISMb-oSwZQL3lF07wHNqta-QaEunG0t68ewnLARRF89uZX5gqkFUAkhErZVaMEnWH5qFRyjyqBA7pab70XdlPezeeVn1pRQC3QqA',
    card2: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDww_cCj1cLqjGgjlxH44eK1G8UB4UoxD-rTcUT0awQZDTRQMoJJSDFO4Qx7ILa-7ubzr_j0rwFFXHrcTsSRm7DuglmdZSztMzPVZih95LIXAj1DTVGyXgPBEX9Zm1L7z0VdqWqv4gIQGU0C78lW6siwNhNvWoL72Pf_oqqmPxE9LVIUF_2IrG0SW9AcrQWvDRImJGRU0Xhf3fvtF4zCiMXmQEuPZ-_Ur_xspB-gDf927QVZm6A3eXF8T3ZqdHhVqDmBefH0WK7P-ls',
    phone: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_i6qVstOl5xlJ8zKWI8zvtR0nMVHLQxnbOpd6DmFKD1rZjzlayY6Xralsrv7Gc2hPLvGpGOZz0zi0uJ7iEw6xrZ2icBh1sXpK0ifUYVvvaABPLomYJ9DacxtpyT-vgRvqfem73GyKbqWXkcRmvHLtvO_EGBsSW2gWvXpabZksZ-zIJvf4KVca4LOu6MqSwMIijqECph7FC2rreB2FrjDuSE9e_6gv4Y2b-9nSGisO_5f9HsDbxYhcgI7OelTaml4kK84jpPYe6A4N',
};

export default function Hero() {
    const handleStartNow = () => {
        navigateTo("/buat-undangan");
    };

    const handleDemo = () => {
        navigateTo("/#cara");
    };

    return (
        <section id="tema" className="relative pt-28 sm:pt-32 pb-14 sm:pb-16 lg:pt-40 lg:pb-24 overflow-hidden scroll-mt-24">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    {/* Text Content */}
                    <div className="flex-1 text-center lg:text-left animate-enter-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-soft mb-5 sm:mb-6 border border-secondary/20 max-[390px]:px-2.5">
                            <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Platform #1 di Indonesia</span>
                        </div>

                        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] mb-5 sm:mb-6 text-slate-900 dark:text-white">
                            Rayakan <span className="italic text-primary">Cinta</span><br />
                            Tanpa Batas.
                        </h1>

                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-7 sm:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                            Buat undangan digital estetik yang praktis, elegan, dan kekinian. Bagikan momen bahagiamu hanya dengan satu klik.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                            <button
                                onClick={handleStartNow}
                                className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 text-sm sm:text-base font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>Mulai Sekarang</span>
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                            <button
                                onClick={handleDemo}
                                className="w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm sm:text-base font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-primary">play_circle</span>
                                <span>Lihat Demo</span>
                            </button>
                        </div>

                        <div className="mt-8 sm:mt-10 flex flex-col min-[430px]:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 text-sm text-slate-500 font-medium">
                            <div className="flex -space-x-3">
                                {avatars.map((url, i) => (
                                    <div
                                        key={i}
                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-gray-200 bg-cover bg-center"
                                        style={{ backgroundImage: `url('${url}')` }}
                                    />
                                ))}
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[11px] sm:text-xs font-bold shadow-sm">2k+</div>
                            </div>
                            <p className="text-center lg:text-left">Pasangan telah memakai layanan ini</p>
                        </div>
                    </div>

                    {/* Visuals */}
                    <div className="flex-1 w-full max-w-[600px] lg:max-w-none relative animate-enter-up anim-delay-2">
                        <div className="relative w-full aspect-square lg:aspect-[4/3]">
                            {/* Card 1 (Back) */}
                            <div className="absolute top-0 right-0 w-[65%] h-[80%] bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl transform rotate-6 border border-slate-100 dark:border-slate-700 overflow-hidden opacity-60">
                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${heroImages.card1}')` }}></div>
                            </div>

                            {/* Card 2 (Middle) */}
                            <div className="absolute top-8 right-12 w-[65%] h-[80%] bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl transform -rotate-3 border border-slate-100 dark:border-slate-700 overflow-hidden opacity-90">
                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${heroImages.card2}')` }}></div>
                            </div>

                            {/* Card 3 (Front - Phone) */}
                            <div className="absolute bottom-0 left-4 sm:left-12 w-[60%] sm:w-[55%] aspect-[9/16] bg-slate-900 rounded-[2.5rem] shadow-2xl transform rotate-0 border-8 border-slate-900 overflow-hidden z-20">
                                <div className="w-full h-full bg-white relative">
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImages.phone}')` }}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                    </div>
                                    <div className="absolute bottom-8 left-0 right-0 text-center text-white px-4">
                                        <p className="font-serif italic text-2xl mb-1">Save the Date</p>
                                        <h3 className="font-display font-bold text-lg uppercase tracking-widest mb-4">Rizky &amp; Anisa</h3>
                                        <button className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs px-4 py-2 rounded-full">Buka Undangan</button>
                                    </div>
                                </div>
                            </div>

                            {/* Floating UI Badge */}
                            <div className="absolute top-[40%] left-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 animate-bounce max-[390px]:hidden" style={{ animationDuration: '3s' }}>
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 text-green-600 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-xl">rsvp</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">RSVP Masuk</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Budi Santoso</p>
                                        <p className="text-[10px] text-green-600 font-medium">Akan Hadir</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
