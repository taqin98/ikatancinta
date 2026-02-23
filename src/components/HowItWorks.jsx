const steps = [
  {
    title: "Pilih Tema",
    description: "Tentukan desain undangan yang paling cocok dengan gaya acara kamu.",
  },
  {
    title: "Isi Data",
    description: "Masukkan data mempelai, jadwal acara, lokasi, dan informasi penting lainnya.",
  },
  {
    title: "Publikasi",
    description: "Aktifkan undangan dan bagikan link langsung ke tamu via WhatsApp.",
  },
];

export default function HowItWorks() {
  return (
    <section id="cara" className="py-16 sm:py-20 bg-background-light dark:bg-background-dark scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 animate-enter-up">
          <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block">
            Cara Membuat Undangan
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Mulai dalam 3 Langkah
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Ikuti panduan singkat berikut untuk menyiapkan undangan digitalmu dengan cepat.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          <div className="rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 sm:p-6 lg:p-8 animate-enter-up anim-delay-1">
            <ol className="space-y-5">
              {steps.map((step, index) => (
                <li key={step.title} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 sm:p-4 lg:p-5 animate-enter-up anim-delay-2">
            <div className="w-full aspect-video rounded-[1.25rem] overflow-hidden bg-slate-200">
              <video
                className="w-full h-full object-cover"
                controls
                preload="metadata"
                playsInline
              >
                <source src="/videos/novo-amor-anchor.mp4" type="video/mp4" />
              </video>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 px-1">
              Video demo visual platform. Alur utama tetap mengikuti 3 langkah di sisi kiri.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
