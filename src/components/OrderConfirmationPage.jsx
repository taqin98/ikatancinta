import { useEffect, useState } from "react";
import { ORDER_CONFIRMATION_STORAGE_KEY } from "../services/dummyOrderApi";
import { navigateTo } from "../utils/navigation";

function formatDateTimeID(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoneyID(value) {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function readOrderDataFromStorage() {
  try {
    const raw = window.localStorage.getItem(ORDER_CONFIRMATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function OrderConfirmationPage() {
  const [orderData, setOrderData] = useState(() => readOrderDataFromStorage());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const latest = readOrderDataFromStorage();
      if (latest) {
        setOrderData(latest);
      }
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!orderData || orderData.status === "done") return undefined;

    const timeoutId = window.setTimeout(() => {
      const latest = readOrderDataFromStorage();
      if (!latest || latest.status === "done") return;
      const next = {
        ...latest,
        status: "done",
        completedAt: new Date().toISOString(),
      };
      try {
        window.localStorage.setItem(ORDER_CONFIRMATION_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage write errors.
      }
      setOrderData(next);
    }, 6500);

    return () => window.clearTimeout(timeoutId);
  }, [orderData]);

  const orderId = orderData?.orderId || "IKC-2409-882";
  const orderReceivedAt = formatDateTimeID(orderData?.createdAt) !== "-" ? `${formatDateTimeID(orderData?.createdAt)} WIB` : "24 Sep 2026, 14:30 WIB";
  const isDone = orderData?.status === "done";
  const orderCompletedAt =
    formatDateTimeID(orderData?.completedAt) !== "-" ? `${formatDateTimeID(orderData?.completedAt)} WIB` : "Estimasi 1x24 Jam";

  const adminWhatsappLink = `https://wa.me/628567452717?text=${encodeURIComponent(
    `Halo admin Ikatancinta.in, saya ingin konfirmasi status order undangan saya. Order ID: ${orderId}.`
  )}`;

  return (
    <main className="bg-background-light dark:bg-background-dark font-display antialiased min-h-screen flex flex-col items-center sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="w-full max-w-md h-full min-h-screen sm:min-h-[calc(100vh-2rem)] bg-surface-light dark:bg-background-dark relative flex flex-col shadow-xl overflow-hidden sm:rounded-2xl sm:border sm:border-slate-100 sm:dark:border-slate-800">
        <header className="flex items-center justify-between p-4 pb-2 z-10">
          <button
            type="button"
            onClick={() => navigateTo("/buat-undangan")}
            className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors"
            aria-label="Kembali"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em]">
              Konfirmasi Order
            </h1>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                isDone
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-primary/15 text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">{isDone ? "task_alt" : "schedule"}</span>
              {isDone ? "Done" : "Processing"}
            </span>
          </div>
          <div className="size-10"></div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col items-center pb-36">
          <div className="w-full aspect-square max-w-[240px] sm:max-w-[280px] my-4 sm:my-6 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/10 rounded-full scale-90 animate-pulse"></div>
            <div
              className="w-full h-full bg-center bg-no-repeat bg-contain z-10"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDkqHgbz07jzBt17r9tF-0r_kgN6D86VmjfdQrA0YKPJptOADsLeqnR2EDOwl4QtwPTgb1eoJIToi1T9boWdtgce0v0YAq5Vf12chPqp4IBNZrYob2elLwvYwDmD_EbCIjNgYVHEkcW3kHAiQdvNB69ei01TWMbBHWNKEcy4t3XOVCyFGoMv-w4upy0JaKy4_DlhKnocsnvTDULQbi6FoVCK7Krbmhe7X6wGI7lxktj68RJUSe-jZdzCgxM9atWNJiyq_NQl5SLztUf')",
              }}
            ></div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-full mb-6">
            <span className="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
            <span className="text-primary font-bold text-xs tracking-wide">ORDER #{orderId}</span>
          </div>

          {orderData && (
            <div className="w-full mb-6 rounded-xl border border-primary/15 bg-primary/5 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Customer</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{orderData.customerName || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Paket</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{orderData.packageTier || "-"} - {orderData.themeName || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatMoneyID(orderData.totalPrice)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
                  <p className="text-sm font-semibold text-primary">{orderData.status || "processing"}</p>
                </div>
              </div>
            </div>
          )}

          <h2 className="text-slate-900 dark:text-slate-100 text-[22px] sm:text-[26px] font-extrabold leading-tight text-center mb-4">
            Terima Kasih! <br />
            Pesanan Anda {isDone ? <span className="text-primary">Selesai Diproses</span> : <span className="text-primary">Sedang Kami Proses</span>}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-normal leading-relaxed text-center mb-8 sm:mb-10 max-w-xs mx-auto">
            {isDone
              ? "Undangan Anda sudah selesai diproses. Tim kami akan menghubungi Anda untuk finalisasi."
              : "Admin kami akan segera memverifikasi pembayaran Anda. Mohon tunggu notifikasi selanjutnya."}
          </p>

          <div className="w-full bg-background-light dark:bg-surface-dark rounded-xl p-5 mb-8">
            <div className="relative flex flex-col gap-6 pl-2">
              <div className="absolute left-[19px] top-3 bottom-8 w-[2px] bg-slate-200 dark:bg-slate-700"></div>

              <div className="flex gap-4 relative z-10">
                <div className="size-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
                  <span className="material-symbols-outlined text-white text-[20px]">check</span>
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-slate-900 dark:text-slate-100 font-bold text-sm">Order Diterima</h3>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">{orderReceivedAt}</span>
                </div>
              </div>

              <div className="flex gap-4 relative z-10">
                {isDone ? (
                  <div className="size-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
                    <span className="material-symbols-outlined text-white text-[20px]">check</span>
                  </div>
                ) : (
                  <div className="size-10 rounded-full bg-white dark:bg-surface-dark border-2 border-primary flex items-center justify-center shrink-0 relative">
                    <div className="size-3 bg-primary rounded-full animate-pulse"></div>
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  <h3 className="text-primary font-bold text-sm">Proses Admin</h3>
                  <span className="text-primary/80 text-xs">{isDone ? "Selesai" : "Sedang berlangsung..."}</span>
                </div>
              </div>

              <div className={`flex gap-4 relative z-10 ${isDone ? "" : "opacity-50"}`}>
                {isDone ? (
                  <div className="size-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
                    <span className="material-symbols-outlined text-white text-[20px]">check</span>
                  </div>
                ) : (
                  <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <div className="size-3 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  <h3 className={`${isDone ? "text-primary font-bold" : "text-slate-500 dark:text-slate-400 font-medium"} text-sm`}>Selesai</h3>
                  <span className={`${isDone ? "text-primary/80" : "text-slate-400 dark:text-slate-500"} text-xs`}>{orderCompletedAt}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="sticky bottom-0 p-4 sm:p-6 pt-2 bg-surface-light/95 dark:bg-background-dark/95 backdrop-blur z-20 w-full border-t border-slate-100 dark:border-slate-800">
          <a
            href={adminWhatsappLink}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] active:bg-[#075E54] text-white font-bold h-12 sm:h-14 rounded-full shadow-lg shadow-[#25D366]/20 transition-all transform active:scale-95 mb-3 text-sm sm:text-base"
          >
            <span className="material-symbols-outlined text-[24px]">chat</span>
            <span>Hubungi Admin via WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={() => navigateTo("/")}
            className="w-full flex items-center justify-center gap-2 bg-transparent text-slate-500 dark:text-slate-400 font-medium h-12 rounded-full hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    </main>
  );
}
