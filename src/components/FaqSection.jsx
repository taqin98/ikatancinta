import { useState } from "react";

const faqs = [
  {
    question: "Berapa lama proses membuat undangan digital?",
    answer:
      "Prosesnya cukup cepat. Setelah mengisi data undangan dan memilih paket, kamu perlu melakukan pembayaran terlebih dahulu. Setelah pembayaran dikonfirmasi melalui WhatsApp, undangan akan diproses dan dipublikasikan.",
  },
  {
    question: "Fitur apa saja yang tersedia di undangan?",
    answer:
      "Fitur yang tersedia antara lain RSVP konfirmasi kehadiran, galeri foto, navigasi lokasi Google Maps, background music, buku tamu, love story, amplop digital, hingga live streaming pada paket tertentu.",
  },
  {
    question: "Bagaimana cara membagikan undangan ke tamu?",
    answer:
      "Setelah undangan dipublikasikan, kamu akan mendapatkan link undangan yang bisa dibagikan ke tamu melalui WhatsApp, media sosial, atau platform lainnya.",
  },
  {
    question: "Apakah bisa menampilkan nama tamu di undangan?",
    answer:
      "Bisa. Fitur Share Eksklusif memungkinkan kamu membuat link undangan dengan nama tamu sehingga undangan terlihat lebih personal untuk setiap tamu.",
  },
  {
    question: "Apakah bisa menggunakan custom domain?",
    answer:
      "Bisa. Custom domain tersedia sebagai fitur opsional dengan biaya tambahan untuk pembelian domain.",
  },
  {
    question: "Apakah data undangan bisa diedit setelah dipublikasikan?",
    answer:
      "Untuk saat ini perubahan data undangan dapat dilakukan dengan menghubungi admin melalui WhatsApp.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-16 sm:py-20 bg-background-light dark:bg-background-dark">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 animate-enter-up">
          <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block">FAQ</span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Pertanyaan yang Sering Ditanyakan
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Ringkasan informasi umum seputar pembuatan undangan digital untuk membantu kamu
            mengambil keputusan lebih cepat.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-3 animate-enter-up anim-delay-1">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <article
                key={faq.question}
                className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="w-full text-left px-4 sm:px-5 py-4 flex items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                >
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{faq.question}</h3>
                  <span className="material-symbols-outlined text-slate-500">
                    {isOpen ? "remove" : "add"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1">
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{faq.answer}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
