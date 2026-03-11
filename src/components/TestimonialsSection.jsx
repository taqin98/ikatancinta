const testimonials = [
  {
    name: "Nadia & Arif",
    city: "Bandung",
    rating: "4.9",
    text: "Awalnya kami ragu pakai undangan digital, tapi ternyata praktis banget. Desainnya juga rapi dan tamu langsung bisa lihat lokasi acara dengan mudah.",
  },
  {
    name: "Rina & Fajar",
    city: "Yogyakarta",
    rating: "4.8",
    text: "Temanya simpel tapi tetap elegan. Kami tinggal bagikan link undangannya ke keluarga dan teman, jadi tidak perlu repot cetak undangan.",
  },
  {
    name: "Dewi & Bagus",
    city: "Surabaya",
    rating: "5.0",
    text: "Proses dari isi data sampai undangan jadi cukup cepat. Beberapa tamu juga bilang tampilannya modern dan mudah dibuka di HP.",
  },
  {
    name: "Salsa & Ilham",
    city: "Jakarta",
    rating: "4.7",
    text: "Kami suka bagian galeri foto dan musik latarnya. Undangannya terasa lebih hidup dan sejauh ini semua tamu bisa buka tanpa masalah.",
  },
  {
    name: "Aisyah & Yusuf",
    city: "Makassar",
    rating: "4.9",
    text: "Yang paling membantu itu fitur konfirmasi kehadiran. Jadi lebih mudah memperkirakan jumlah tamu sebelum hari acara.",
  },
  {
    name: "Putri & Rizky",
    city: "Semarang",
    rating: "4.8",
    text: "Fitur amplop digitalnya cukup membantu, terutama untuk teman yang tidak bisa hadir langsung. Setup undangannya juga tidak ribet.",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimoni" className="py-16 sm:py-20 relative overflow-hidden scroll-mt-24 bg-background-light dark:bg-background-dark">
      <div className="relative w-full overflow-hidden mb-12">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src="/videos/testimoni-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-slate-900/65"></div>
        </div>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-[1] pointer-events-none opacity-50">
          <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16 animate-enter-up">
          <p className="text-primary text-xs font-bold tracking-widest uppercase mb-3">Apa Kata Mereka</p>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
            Testimoni Pasangan <span className="italic text-primary">Ikatancinta.in</span>
          </h2>
          <p className="text-slate-200">
            Ribuan pasangan telah memakai ikatancinta.in untuk merayakan hari spesial mereka
            dengan undangan digital yang estetik dan praktis.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-4 mb-8 animate-enter-up anim-delay-1">
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 sm:p-6 text-center">
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">4.8/5</p>
            <p className="text-sm text-slate-500 mt-1">Rata-rata rating pelanggan</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 sm:p-6 text-center">
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">700+</p>
            <p className="text-sm text-slate-500 mt-1">Undangan telah dipublikasikan</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 sm:p-6 text-center min-[420px]:col-span-2 md:col-span-1">
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">97%</p>
            <p className="text-sm text-slate-500 mt-1">Menyatakan puas dengan layanan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-enter-up anim-delay-2">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.city}</p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-600 px-2.5 py-1 text-xs font-bold">
                  <span className="material-symbols-outlined text-sm">star</span>
                  {item.rating}
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                &ldquo;{item.text}&rdquo;
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
