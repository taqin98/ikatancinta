import { getDefaultSchemaBySlug } from "../templates/basic/schemas";

const DEFAULT_JSON_HEADERS = {
  Accept: "application/json",
};

function cloneJson(value) {
  if (value === undefined || value === null) return value ?? null;
  return JSON.parse(JSON.stringify(value));
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
    return getJson(`${apiUrl}/invitations/${encodeURIComponent(slug)}`);
  }

  await wait();
  return cloneJson(getDefaultSchemaBySlug(slug));
}
