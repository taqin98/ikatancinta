import { navigateTo } from "../utils/navigation";

const plans = [
  {
    name: "BASIC",
    description: "Untuk kamu yang hanya ingin menyebarkan informasi undangan kamu saja.",
    oldPrice: "IDR 110.000",
    price: "IDR 50.000",
    discount: "55% OFF",
    cta: "Pilih BASIC",
    highlighted: false,
    features: [
      "Preset/Desain standar",
      "Quotes",
      "Detail Info Acara",
      "Profil Pasangan",
      "Catatan khusus untuk tamu",
      "Galeri foto (maks. 2)",
      "Background music (list)",
      "Navigasi Lokasi",
      "Menambahkan ke Google Calendar",
      "Unlimited jadwal acara",
      "RSVP (Konfirmasi kehadiran)",
      "Masa Aktif Selamanya",
      "Edit Tanpa Batas",
    ],
  },
  {
    name: "PREMIUM",
    description:
      "Sebarkan informasi, dan tamu bisa memberikan kado, ucapan, serta konfirmasi kehadiran dengan jumlah tamu terbatas.",
    oldPrice: "IDR 250.000",
    price: "IDR 110.000",
    discount: "56% OFF",
    cta: "Pilih PREMIUM",
    highlighted: true,
    features: [
      "Semua yang ada di paket BASIC",
      "Amplop digital (nomor rekening)",
      "Kirim ucapan",
      "Galeri foto (maks. 10)",
      "Love stories",
      "Buku Tamu",
      "Share Eksklusif - nama tamu (maks. 100)",
      "Background music (list dan custom)",
      "Custom domain (opsional)",
      "Preset/Desain premium",
      "Masa Aktif Selamanya",
      "Edit Tanpa Batas",
    ],
  },
  {
    name: "EKSLUSIF",
    description: "Jumlah tamu tanpa batas dengan tampilan yang lebih eksklusif.",
    oldPrice: "IDR 400.000",
    price: "IDR 180.000",
    discount: "55% OFF",
    cta: "Pilih EKSLUSIF",
    highlighted: false,
    features: [
      "Semua yang ada di paket PREMIUM, BASIC",
      "Galeri (maks. 20)",
      "Share Eksklusif - nama tamu (unlimited)",
      "Bisa membeli preset luxury",
      "Semua jenis preset (add on luxury)",
      "Support Prioritas",
      "Bahasa Indonesia/Inggris",
      "Free: Undangan Gambar",
      "Custom Background Gambar Layout Section",
      "Custom domain (opsional)",
      "Live Streaming",
      "Masa Aktif Selamanya",
      "Edit Tanpa Batas",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="harga" className="py-16 sm:py-20 overflow-hidden relative scroll-mt-24">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-enter-up">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Pilih Paket Terbaik
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Tanpa biaya tersembunyi. Sekali bayar untuk selamanya.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-stretch gap-5 lg:gap-8 max-w-7xl mx-auto animate-enter-up anim-delay-1">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`w-full rounded-3xl p-5 sm:p-7 border relative transition-transform duration-300 ${
                plan.highlighted
                  ? "bg-slate-900 dark:bg-slate-800 border-slate-800 shadow-glow xl:scale-105 z-10"
                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:-translate-y-2"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-orange-400 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                  Paling Laris
                </div>
              )}

              <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {plan.name}
              </h3>
              <p
                className={`text-sm mb-6 pb-6 border-b ${
                  plan.highlighted
                    ? "text-slate-300 border-slate-700"
                    : "text-slate-500 border-slate-100 dark:border-slate-700"
                }`}
              >
                {plan.description}
              </p>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-sm line-through ${plan.highlighted ? "text-slate-400" : "text-slate-500"}`}>
                    {plan.oldPrice}
                  </span>
                  <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">
                    {plan.discount}
                  </span>
                </div>
                <p className={`text-3xl font-bold font-display ${plan.highlighted ? "text-white" : "text-slate-900 dark:text-white"}`}>
                  {plan.price}
                </p>
              </div>

              <ul className="space-y-3 mb-6 sm:mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-3 text-sm ${
                      plan.highlighted ? "text-white" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-lg mt-0.5 ${
                        plan.highlighted ? "text-primary" : "text-green-500"
                      }`}
                    >
                      check
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => navigateTo(`/buat-undangan?package=${plan.name}`)}
                className={`w-full py-3 rounded-xl font-bold transition-colors ${
                  plan.highlighted
                    ? "bg-primary hover:bg-pink-600 text-white shadow-lg shadow-primary/25"
                    : "border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-900 hover:text-slate-900 dark:hover:border-white dark:hover:text-white"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
