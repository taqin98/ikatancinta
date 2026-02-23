export const ORDER_CONFIRMATION_STORAGE_KEY = "ikatancinta_last_order_confirmation_v1";
const DUMMY_FAIL_ONCE_SESSION_KEY = "ikatancinta_dummy_fail_once_consumed_v1";

function createOrderId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `IKC-${yy}${mm}${dd}-${random}`;
}

export async function submitOrderDummy(payload) {
  await new Promise((resolve) => window.setTimeout(resolve, 1100));

  const params = new URLSearchParams(window.location.search);
  const shouldFailFromQuery = params.get("mock_fail") === "1";
  const shouldFailOnce = params.get("mock_fail_once") === "1";
  const shouldFailFromEmail = typeof payload?.customer?.email === "string" && payload.customer.email.includes("fail");
  let shouldFailFromFailOnce = false;

  if (shouldFailOnce) {
    const consumed = window.sessionStorage.getItem(DUMMY_FAIL_ONCE_SESSION_KEY) === "1";
    if (!consumed) {
      shouldFailFromFailOnce = true;
      window.sessionStorage.setItem(DUMMY_FAIL_ONCE_SESSION_KEY, "1");
    }
  }

  if (shouldFailFromQuery || shouldFailFromEmail || shouldFailFromFailOnce) {
    const error = new Error("Gagal mengirim pesanan ke server dummy.");
    error.code = "DUMMY_SUBMIT_FAILED";
    throw error;
  }

  return {
    success: true,
    orderId: createOrderId(),
    createdAt: new Date().toISOString(),
    status: "processing",
    message: "Pesanan berhasil diterima dan sedang diproses admin.",
  };
}
