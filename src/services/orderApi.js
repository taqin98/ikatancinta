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

function getOrderApiConfig() {
  const submitApiUrl = import.meta.env.VITE_ORDER_API_SUBMIT_URL || "";
  const emailApiUrl = import.meta.env.VITE_ORDER_API_EMAIL_URL || "";
  const mode = (import.meta.env.VITE_ORDER_API_MODE || "dummy").toLowerCase();
  return { mode, submitApiUrl, emailApiUrl };
}

function slugifySegment(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function pickSlugNameSegment(person = {}) {
  const source = person?.nickname || person?.fullname || "";
  const normalized = slugifySegment(source);
  if (!normalized) return "";
  return normalized.split("-")[0] || normalized;
}

function buildInvitationSlug(payload = {}) {
  const akadDate = String(payload?.akad?.date || "").trim();
  const dateMatch = akadDate.match(/^(\d{4})-(\d{2})/);
  const datePrefix = dateMatch ? `${dateMatch[1]}${dateMatch[2]}` : "";
  const brideSegment = pickSlugNameSegment(payload?.bride);
  const groomSegment = pickSlugNameSegment(payload?.groom);
  const parts = [datePrefix, brideSegment, groomSegment].filter(Boolean);
  return parts.length > 0 ? parts.join("-") : null;
}

function withInvitationSlug(payload = {}) {
  const invitationSlug = payload?.invitationSlug || payload?.invitation_slug || buildInvitationSlug(payload);
  if (!invitationSlug) return payload;

  return {
    ...payload,
    invitationSlug,
    invitation_slug: invitationSlug,
  };
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

async function getJson(url, options = {}) {
  const { headers = {}, credentials = "same-origin" } = options;
  const response = await fetch(url, {
    method: "GET",
    credentials,
    headers: {
      Accept: "application/json",
      ...headers,
    },
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
    invitationSlug:
      raw?.invitationSlug ||
      raw?.invitation_slug ||
      raw?.data?.invitationSlug ||
      raw?.data?.invitation_slug ||
      raw?.data?.payload?.invitationSlug ||
      raw?.data?.payload?.invitation_slug ||
      null,
    createdAt: raw?.createdAt || raw?.data?.createdAt || new Date().toISOString(),
    completedAt: raw?.completedAt || raw?.data?.completedAt || null,
    status: raw?.status || raw?.data?.status || "processing",
    message: raw?.message || raw?.data?.message || "Pesanan berhasil diterima dan sedang diproses admin.",
    customerName: raw?.customerName || raw?.data?.customerName || raw?.data?.customer?.name || null,
    themeName: raw?.themeName || raw?.data?.themeName || raw?.data?.selectedTheme?.name || null,
    themeSlug: raw?.themeSlug || raw?.data?.themeSlug || raw?.data?.selectedTheme?.slug || null,
    packageTier: raw?.packageTier || raw?.data?.packageTier || raw?.data?.selectedPackage?.tier || null,
    totalPrice: raw?.totalPrice || raw?.data?.totalPrice || raw?.data?.selectedPackage?.price || null,
    payload: raw?.payload || raw?.data?.payload || null,
    raw,
  };
}

export function isRealOrderApiEnabled() {
  const { mode, submitApiUrl } = getOrderApiConfig();
  return mode === "real" && Boolean(submitApiUrl);
}

export async function fetchOrderById(orderId) {
  const { mode, submitApiUrl } = getOrderApiConfig();
  if (mode !== "real" || !submitApiUrl || !orderId) {
    return null;
  }

  const raw = await getJson(`${submitApiUrl}/${encodeURIComponent(orderId)}`);
  return buildOrderResultShape(raw);
}

async function triggerCustomerEmail({ payload, orderResult }) {
  const { emailApiUrl } = getOrderApiConfig();
  if (!emailApiUrl) return;

  const emailBody = {
    orderId: orderResult.orderId,
    createdAt: orderResult.createdAt,
    status: orderResult.status,
    customer: payload.customer,
    selectedTheme: payload.selectedTheme,
    selectedPackage: payload.selectedPackage,
    summary: {
      hasFrontCover: Boolean(payload.frontCoverImage),
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
  const { submitApiUrl } = getOrderApiConfig();
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
  const { mode } = getOrderApiConfig();
  const normalizedPayload = withInvitationSlug(payload);

  if (mode === "real") {
    return submitOrderReal(normalizedPayload);
  }

  return submitOrderDummy(normalizedPayload);
}
