import { submitOrderDummy } from "./dummyOrderApi";

const DEFAULT_JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

function readJsonSafely(response) {
  return response.text().then((text) => {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  });
}

async function postJson(url, body, options = {}) {
  const { headers = {}, credentials = "same-origin" } = options;
  const response = await fetch(url, {
    method: "POST",
    credentials,
    headers: {
      ...DEFAULT_JSON_HEADERS,
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const data = await readJsonSafely(response);

  if (!response.ok) {
    const messageFromBody =
      (data && typeof data === "object" && (data.message || data.error)) ||
      `HTTP ${response.status}`;
    const error = new Error(`ORDER_API_REQUEST_FAILED: ${messageFromBody}`);
    error.code = "ORDER_API_REQUEST_FAILED";
    error.status = response.status;
    error.response = data;
    throw error;
  }

  return data;
}

function buildOrderResultShape(raw) {
  return {
    success: raw?.success ?? true,
    orderId: raw?.orderId || raw?.id || raw?.data?.orderId || `IKC-${Date.now()}`,
    createdAt: raw?.createdAt || raw?.data?.createdAt || new Date().toISOString(),
    status: raw?.status || raw?.data?.status || "processing",
    message: raw?.message || raw?.data?.message || "Pesanan berhasil diterima dan sedang diproses admin.",
    raw,
  };
}

async function triggerCustomerEmail({ payload, orderResult }) {
  const emailApiUrl = import.meta.env.VITE_ORDER_API_EMAIL_URL;
  if (!emailApiUrl) return;

  const emailBody = {
    orderId: orderResult.orderId,
    createdAt: orderResult.createdAt,
    status: orderResult.status,
    customer: payload.customer,
    selectedTheme: payload.selectedTheme,
    selectedPackage: payload.selectedPackage,
    summary: {
      hasCover: Boolean(payload.coverImage),
      galleryCount: Array.isArray(payload.galleryImages) ? payload.galleryImages.length : 0,
      storiesCount: Array.isArray(payload.stories) ? payload.stories.length : 0,
      musicMode: payload.music?.mode || "list",
    },
    orderPayload: payload,
  };

  await postJson(emailApiUrl, emailBody);
}

async function submitOrderReal(payload) {
  const submitApiUrl = import.meta.env.VITE_ORDER_API_SUBMIT_URL;
  if (!submitApiUrl) {
    const error = new Error("ORDER_API_REAL_URL_NOT_CONFIGURED");
    error.code = "ORDER_API_REAL_URL_NOT_CONFIGURED";
    throw error;
  }

  const submitResponse = await postJson(submitApiUrl, payload);
  const orderResult = buildOrderResultShape(submitResponse);

  try {
    await triggerCustomerEmail({ payload, orderResult });
  } catch (error) {
    // Email notification is best-effort; order submission must remain successful.
    console.warn("ORDER_EMAIL_TRIGGER_FAILED", error);
  }

  return orderResult;
}

export async function submitOrder(payload) {
  const mode = (import.meta.env.VITE_ORDER_API_MODE || "dummy").toLowerCase();

  if (mode === "real") {
    return submitOrderReal(payload);
  }

  return submitOrderDummy(payload);
}
