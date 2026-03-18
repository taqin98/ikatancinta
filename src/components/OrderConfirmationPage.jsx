import { useEffect, useState } from "react";
import { ORDER_CONFIRMATION_STORAGE_KEY } from "../services/dummyOrderApi";
import { fetchOrderById, isRealOrderApiEnabled } from "../services/orderApi";
import { fetchPaymentMethods } from "../services/paymentMethodsApi";
import { getOrderIdFromConfirmationPath, navigateTo } from "../utils/navigation";

const TERMINAL_ORDER_STATUSES = new Set(["done", "completed", "cancelled", "failed"]);

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

function readOrderDataFromStorage(forceProcessing = false) {
  try {
    const raw = window.localStorage.getItem(ORDER_CONFIRMATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (forceProcessing && isTerminalOrderStatus(parsed.status)) {
      return {
        ...parsed,
        status: "processing",
        completedAt: null,
      };
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeOrderDataToStorage(orderData) {
  if (!orderData) return;
  try {
    window.localStorage.setItem(ORDER_CONFIRMATION_STORAGE_KEY, JSON.stringify(orderData));
  } catch {
    // Ignore storage write errors.
  }
}

function isTerminalOrderStatus(status) {
  if (!status) return false;
  return TERMINAL_ORDER_STATUSES.has(String(status).toLowerCase());
}

function createInitialOrderData(isRealMode, routeOrderId) {
  const storedOrder = readOrderDataFromStorage(isRealMode);
  if (!routeOrderId) return storedOrder;
  if (storedOrder?.orderId === routeOrderId) return storedOrder;

  return {
    orderId: routeOrderId,
    status: "processing",
    completedAt: null,
  };
}

export default function OrderConfirmationPage() {
  const isRealMode = isRealOrderApiEnabled();
  const routeOrderId = getOrderIdFromConfirmationPath();
  const [orderData, setOrderData] = useState(() => createInitialOrderData(isRealMode, routeOrderId));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [expandedQr, setExpandedQr] = useState({});
  const orderId = orderData?.orderId || routeOrderId || "IKC-2409-882";
  const isTerminal = isTerminalOrderStatus(orderData?.status);

  useEffect(() => {
    if (isRealMode) return undefined;

    const intervalId = window.setInterval(() => {
      const latest = readOrderDataFromStorage();
      if (latest) {
        setOrderData(latest);
      }
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [isRealMode]);

  useEffect(() => {
    if (!routeOrderId || routeOrderId === orderData?.orderId) return;
    setOrderData({
      orderId: routeOrderId,
      status: "processing",
      completedAt: null,
    });
  }, [routeOrderId, orderData?.orderId]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingPayments(true);
    fetchPaymentMethods()
      .then((methods) => {
        if (!cancelled) setPaymentMethods(methods);
      })
      .catch(() => { })
      .finally(() => {
        if (!cancelled) setIsLoadingPayments(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isRealMode || !orderData?.orderId) return undefined;

    let isCancelled = false;

    const syncOrderFromApi = async () => {
      setIsRefreshing(true);
      try {
        const latest = await fetchOrderById(orderData.orderId);
        if (!latest || isCancelled) return;

        setOrderData((current) => {
          const next = { ...(current || {}), ...latest };
          if (
            current?.status === next.status &&
            current?.completedAt === next.completedAt &&
            current?.createdAt === next.createdAt &&
            current?.customerName === next.customerName &&
            current?.packageTier === next.packageTier &&
            current?.themeName === next.themeName &&
            current?.totalPrice === next.totalPrice
          ) {
            return current;
          }
          writeOrderDataToStorage(next);
          return next;
        });
      } catch {
        // Keep the last known local state if API fetch fails.
      } finally {
        if (!isCancelled) setIsRefreshing(false);
      }
    };

    syncOrderFromApi();

    return () => {
      isCancelled = true;
    };
  }, [isRealMode, orderData?.orderId]);

  const handleRefreshStatus = async () => {
    if (!isRealMode || !orderData?.orderId || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const latest = await fetchOrderById(orderData.orderId);
      if (!latest) return;

      setOrderData((current) => {
        const next = { ...(current || {}), ...latest };
        writeOrderDataToStorage(next);
        return next;
      });
    } catch {
      // Keep the last known local state if manual refresh fails.
    } finally {
      setIsRefreshing(false);
    }
  };

  const orderReceivedAt = formatDateTimeID(orderData?.createdAt) !== "-" ? `${formatDateTimeID(orderData?.createdAt)} WIB` : "24 Sep 2026, 14:30 WIB";
  const isDone = orderData?.status === "done" || orderData?.status === "completed";
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
            disabled={isRefreshing}
            className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Kembali"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em]">
              Konfirmasi Pesanan
            </h1>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isDone
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-primary/15 text-primary"
                }`}
            >
              <span className="material-symbols-outlined text-[12px]">{isDone ? "task_alt" : "schedule"}</span>
              {isDone ? "Selesai" : "Diproses"}
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
            <div className="w-full mb-6 rounded-md border border-primary/15 bg-primary/5 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Pelanggan</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{orderData.customerName || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Paket</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{orderData.packageTier || "-"} - {orderData.themeName || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Harga</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatMoneyID(orderData.totalPrice)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
                  <p className="text-sm font-semibold text-primary">{orderData.status || "processing"}</p>
                </div>
              </div>
            </div>
          )}

          {!isDone && (() => {
            const hasAny = paymentMethods.length > 0;

            return (
              <div className="w-full mb-6 rounded-md border border-amber-200 dark:border-amber-700/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 overflow-hidden">
                <div className="px-4 py-3 bg-amber-100/60 dark:bg-amber-900/30 border-b border-amber-200/60 dark:border-amber-700/40 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px]">account_balance_wallet</span>
                  <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200">Metode Pembayaran</h3>
                </div>
                <div className="p-4 space-y-3">
                  {isLoadingPayments ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-3 w-3/4 bg-amber-200/60 dark:bg-amber-800/30 rounded" />
                      <div className="h-16 bg-amber-200/40 dark:bg-amber-800/20 rounded-xl" />
                      <div className="h-16 bg-amber-200/40 dark:bg-amber-800/20 rounded-xl" />
                    </div>
                  ) : !hasAny ? (
                    <p className="text-xs text-amber-700 dark:text-amber-300/80">Hubungi admin untuk informasi pembayaran.</p>
                  ) : (
                    <>
                      <p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">
                        Silakan lakukan pembayaran sesuai total pesanan ke salah satu metode berikut:
                      </p>

                      {paymentMethods.map((item) => (
                        <div key={item.methodId} className="bg-white dark:bg-slate-800/60 rounded-md p-3 border border-amber-200/50 dark:border-slate-700/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div
                              className={`flex items-center gap-3 min-w-0 flex-1${item.urlContent ? " cursor-pointer" : ""}`}
                              onClick={() => {
                                if (!item.urlContent) return;
                                setExpandedQr((prev) => ({ ...prev, [item.methodId]: !prev[item.methodId] }));
                              }}
                            >
                              {item.logoUrl ? (
                                <img src={item.logoUrl} alt={item.label} className="w-10 h-7 object-contain shrink-0 rounded" />
                              ) : (
                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[24px] shrink-0">
                                  {item.type === "e_wallet" ? "account_balance_wallet" : "account_balance"}
                                </span>
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">{item.label}</span>
                                {item.accountNumber && (
                                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 tracking-wide">{item.accountNumber}</p>
                                )}
                                {item.accountName && <p className="text-[11px] text-slate-500 dark:text-slate-400">a.n {item.accountName}</p>}
                                {!item.accountNumber && item.description && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.description}</p>
                                )}
                              </div>
                              {item.urlContent && (
                                <span
                                  className={`material-symbols-outlined text-[18px] text-amber-500 dark:text-amber-400 shrink-0 transition-transform duration-200 ${
                                    expandedQr[item.methodId] ? "rotate-180" : ""
                                  }`}
                                >expand_more</span>
                              )}
                            </div>
                            {item.accountNumber && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  const btn = e.currentTarget;
                                  const textEl = btn.querySelector("span:last-child");
                                  navigator.clipboard?.writeText(item.accountNumber).catch(() => {
                                    const ta = document.createElement("textarea");
                                    ta.value = item.accountNumber;
                                    document.body.appendChild(ta);
                                    ta.select();
                                    document.execCommand("copy");
                                    document.body.removeChild(ta);
                                  });
                                  if (textEl) {
                                    const orig = textEl.textContent;
                                    textEl.textContent = "Tersalin!";
                                    btn.classList.add("!bg-emerald-50", "!border-emerald-300", "!text-emerald-600");
                                    setTimeout(() => {
                                      textEl.textContent = orig;
                                      btn.classList.remove("!bg-emerald-50", "!border-emerald-300", "!text-emerald-600");
                                    }, 1500);
                                  }
                                }}
                                className="shrink-0 ml-2 flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all"
                              >
                                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                <span>Salin</span>
                              </button>
                            )}
                          </div>

                          {/* QR Code / content image — collapsible */}
                          {item.urlContent && (
                            <div
                              className="overflow-hidden transition-all duration-300 ease-in-out"
                              style={{ maxHeight: expandedQr[item.methodId] ? "400px" : "0px", opacity: expandedQr[item.methodId] ? 1 : 0 }}
                            >
                              <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-900/30 rounded-lg p-3 border border-slate-200 dark:border-slate-700 mt-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Scan {item.label}</p>
                                <div className="w-full max-w-[220px] aspect-square">
                                  <img
                                    src={item.urlContent}
                                    alt={`QR Code ${item.label}`}
                                    className="w-full h-full object-contain rounded-lg"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5 pt-1">
                        <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">info</span>
                        Setelah melakukan pembayaran, segera konfirmasi ke admin agar pesanan Anda diproses.
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          <h2 className="text-slate-900 dark:text-slate-100 text-[22px] sm:text-[26px] font-extrabold leading-tight text-center mb-4">
            Terima Kasih! <br />
            Pesanan Anda {isDone ? <span className="text-primary">Telah Selesai</span> : <span className="text-primary">Sedang Diproses</span>}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-normal leading-relaxed text-center mb-8 sm:mb-10 max-w-xs mx-auto">
            {isDone
              ? "Undangan Anda sudah selesai dan siap dibagikan. Terima kasih telah mempercayakan undangan Anda kepada kami."
              : "Silakan lakukan pembayaran terlebih dahulu, lalu konfirmasi ke admin. Pesanan akan segera kami proses setelah pembayaran dikonfirmasi."}
          </p>

          <div className="w-full bg-background-light dark:bg-surface-dark rounded-xl p-5 mb-8">
            <div className="relative flex flex-col gap-6 pl-2">
              <div className="absolute left-[19px] top-3 bottom-8 w-[2px] bg-slate-200 dark:bg-slate-700"></div>

              <div className="flex gap-4 relative z-10">
                <div className="size-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
                  <span className="material-symbols-outlined text-white text-[20px]">check</span>
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-slate-900 dark:text-slate-100 font-bold text-sm">Pesanan Diterima</h3>
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
                  <h3 className="text-primary font-bold text-sm">Verifikasi & Proses</h3>
                  <span className="text-primary/80 text-xs">{isDone ? "Selesai" : "Menunggu pembayaran..."}</span>
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
                  <h3 className={`${isDone ? "text-primary font-bold" : "text-slate-500 dark:text-slate-400 font-medium"} text-sm`}>Undangan Selesai</h3>
                  <span className={`${isDone ? "text-primary/80" : "text-slate-400 dark:text-slate-500"} text-xs`}>{orderCompletedAt}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="sticky bottom-0 p-4 sm:p-6 pt-2 bg-surface-light/95 dark:bg-background-dark/95 backdrop-blur z-20 w-full border-t border-slate-100 dark:border-slate-800">
          {isRealMode && !isTerminal && (
            <button
              type="button"
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="mb-3 w-full flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-white dark:bg-surface-dark text-primary font-semibold h-11 sm:h-12 hover:bg-primary/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <span
                  className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                  aria-hidden="true"
                ></span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">refresh</span>
              )}
              <span>{isRefreshing ? "Memuat Status..." : "Perbarui Status"}</span>
            </button>
          )}
          <a
            href={adminWhatsappLink}
            onClick={(event) => {
              if (isRefreshing) event.preventDefault();
            }}
            target="_blank"
            rel="noreferrer"
            aria-disabled={isRefreshing}
            tabIndex={isRefreshing ? -1 : undefined}
            className={`w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] active:bg-[#075E54] text-white font-bold h-12 sm:h-14 rounded-full shadow-lg shadow-[#25D366]/20 transition-all transform active:scale-95 mb-3 text-sm sm:text-base ${isRefreshing ? "pointer-events-none opacity-60" : ""
              }`}
          >
            <span className="material-symbols-outlined text-[24px]">chat</span>
            <span>Konfirmasi via WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={() => navigateTo("/")}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2 bg-transparent text-slate-500 dark:text-slate-400 font-medium h-12 rounded-full hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    </main>
  );
}
