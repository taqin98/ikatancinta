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

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: DEFAULT_JSON_HEADERS,
    body: JSON.stringify(body),
  });
  const data = await readJsonSafely(response);

  if (!response.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    const error = new Error(`WISHES_API_REQUEST_FAILED: ${message}`);
    error.status = response.status;
    error.response = data;
    throw error;
  }

  return data;
}

function normalizeWishPayload(payload) {
  return {
    name: String(payload?.author || payload?.name || "").trim(),
    attendance: String(payload?.attendance || "Hadir").trim(),
    message: String(payload?.comment || payload?.message || "").trim(),
  };
}

export async function postInvitationWish(slug, payload) {
  const apiUrl = import.meta.env.VITE_INVITATION_API_URL;
  const mode = (import.meta.env.VITE_INVITATION_API_MODE || (apiUrl ? "real" : "dummy")).toLowerCase();
  const normalizedPayload = normalizeWishPayload(payload);

  if (mode === "real" && apiUrl && slug) {
    return postJson(`${apiUrl}/invitations/${encodeURIComponent(slug)}/wishes`, normalizedPayload);
  }

  return {
    success: true,
    message: "Wish accepted locally",
    data: {
      author: normalizedPayload.name || "Anonim",
      comment: normalizedPayload.message,
      attendance: normalizedPayload.attendance,
      createdAt: new Date().toISOString(),
    },
  };
}

