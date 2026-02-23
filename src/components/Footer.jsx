export default function Footer() {
  const paymentMethods = [
    {
      key: "bca",
      src: "/payment/bca.png",
      alt: "Logo BCA",
    },
    {
      key: "shopeepay",
      src: "/payment/shopee.png",
      alt: "Logo ShopeePay",
    },
    {
      key: "dana",
      src: "/payment/dana.png",
      alt: "Logo DANA",
    },
    {
      key: "qris-bca",
      src: "/payment/qris.png",
      alt: "Logo QRIS",
    },
  ];

  return (
    <footer className="bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800 pt-10 sm:pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="material-symbols-outlined text-primary">
                favorite
              </span>
              <span className="font-serif font-bold text-xl text-slate-900 dark:text-white">
                ikatancinta.in
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-300 max-w-sm">
              Platform undangan digital untuk pasangan yang ingin berbagi momen
              spesial dengan cara yang estetik dan praktis.
            </p>
          </div>

          <div className="lg:col-span-5">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-3">
              Metode Pembayaran
            </h3>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <span
                  key={method.key}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  aria-label={method.key}
                  title={method.key}
                >
                  <img src={method.src} alt={method.alt} className="h-4 sm:h-5 w-auto block" loading="lazy" />
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-3">
              Lebih Dekat dengan Kami
            </h3>
            <div className="space-y-2">
              <a
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                href={`https://wa.me/628567452717?text=${encodeURIComponent("konsultasi undangan digital ikatancinta.in")}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-base">call</span>
                0856-7452-717
              </a>
              <a
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                href="https://www.instagram.com/ikatancinta.in/"
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-base">photo_camera</span>
                @ikatancinta.in
              </a>
              <a
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                href="mailto:hello@ikatancinta.in"
              >
                <span className="material-symbols-outlined text-base">mail</span>
                hello@ikatancinta.in
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            © 2026 Ikatancinta.in. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
