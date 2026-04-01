import { getDefaultSchemaBySlug } from "../templates/basic/schemas";

const DEFAULT_JSON_HEADERS = {
  Accept: "application/json",
};

function sanitizeGuestName(value) {
  if (typeof value !== "string") return value ?? "";
  const normalized = value.replace(/\s+/g, " ").trim().toLowerCase();
  if (normalized === "nama tamu") {
    return "";
  }
  return value;
}

function sanitizeInvitationPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;

  const nextPayload = cloneJson(payload);

  if (nextPayload?.guest && typeof nextPayload.guest === "object") {
    nextPayload.guest.name = sanitizeGuestName(nextPayload.guest.name);
  }

  return nextPayload;
}

function cloneJson(value) {
  if (value === undefined || value === null) return value ?? null;
  return JSON.parse(JSON.stringify(value));
}

function createWishRecordFromFallback(item, slug, index) {
  return {
    wishId: `wish_demo_${slug || "invitation"}_${index + 1}`,
    invitationSlug: slug || null,
    orderId: null,
    name: item?.name || item?.author || "Anonim",
    attendance: item?.attendance || "hadir",
    message: item?.message || item?.comment || "",
    createdAt: item?.createdAt || new Date().toISOString(),
  };
}

function wait(ms = 180) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

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

async function getJson(url) {
  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
    headers: DEFAULT_JSON_HEADERS,
  });
  const data = await readJsonSafely(response);

  if (!response.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    const error = new Error(`INVITATION_API_REQUEST_FAILED: ${message}`);
    error.status = response.status;
    error.response = data;
    throw error;
  }

  return data;
}

export async function fetchInvitationBySlug(slug) {
  const apiUrl = import.meta.env.VITE_INVITATION_API_URL;
  const mode = (import.meta.env.VITE_INVITATION_API_MODE || (apiUrl ? "real" : "dummy")).toLowerCase();

  if (mode === "real" && apiUrl && slug) {
    const data = await getJson(`${apiUrl}/invitations/${encodeURIComponent(slug)}`);
    return sanitizeInvitationPayload(data);
  }

  await wait();
  return sanitizeInvitationPayload(getDefaultSchemaBySlug(slug));
}

export async function fetchInvitationWishListBySlug(slug) {
  const apiUrl = import.meta.env.VITE_INVITATION_API_URL;
  const mode = (import.meta.env.VITE_INVITATION_API_MODE || (apiUrl ? "real" : "dummy")).toLowerCase();

  if (mode === "real" && apiUrl && slug) {
    const data = await getJson(`${apiUrl}/invitations/${encodeURIComponent(slug)}/list-wishes`);
    const wishes = Array.isArray(data?.data?.wishes) ? data.data.wishes : Array.isArray(data?.wishes) ? data.wishes : [];

    return {
      invitationSlug: data?.data?.invitationSlug || data?.invitationSlug || slug,
      orderId: data?.data?.orderId || data?.orderId || null,
      total: Number.isFinite(data?.data?.total) ? data.data.total : wishes.length,
      wishes,
    };
  }

  await wait();

  const fallbackInvitation = cloneJson(getDefaultSchemaBySlug(slug));
  const fallbackWishes = Array.isArray(fallbackInvitation?.wishes?.initial) ? fallbackInvitation.wishes.initial : [];
  const wishes = fallbackWishes.map((item, index) => createWishRecordFromFallback(item, slug, index));

  return {
    invitationSlug: slug || null,
    orderId: null,
    total: wishes.length,
    wishes,
  };
}
