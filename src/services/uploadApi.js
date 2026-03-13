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

function dataUrlToBlob(dataUrl, fallbackMimeType = "application/octet-stream") {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return new Blob([""], { type: fallbackMimeType });
  }

  const [meta, content = ""] = dataUrl.split(",");
  const mimeTypeMatch = meta.match(/^data:([^;]+)(;base64)?/i);
  const mimeType = mimeTypeMatch?.[1] || fallbackMimeType;
  const isBase64 = /;base64/i.test(meta);

  if (!content) {
    return new Blob([""], { type: mimeType });
  }

  if (!isBase64) {
    return new Blob([decodeURIComponent(content)], { type: mimeType });
  }

  const binary = window.atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function resolveUploadBlob(payload) {
  if (payload?.file instanceof Blob) {
    return payload.file;
  }
  return dataUrlToBlob(payload?.dataUrl, payload?.mimeType);
}

function buildUploadFormData(payload) {
  const formData = new FormData();
  const filename = payload?.name || "asset";
  const blob = resolveUploadBlob(payload);

  formData.append("file", blob, filename);
  formData.append("kind", payload?.kind || "file");
  formData.append("name", filename);
  if (payload?.orderId) {
    formData.append("orderId", payload.orderId);
  }
  formData.append("mimeType", payload?.mimeType || blob.type || "application/octet-stream");
  if (payload?.size != null) {
    formData.append("size", String(payload.size));
  }

  return formData;
}

async function postFormData(url, formData) {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });
  const data = await readJsonSafely(response);

  if (!response.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    const error = new Error(`UPLOAD_API_REQUEST_FAILED: ${message}`);
    error.status = response.status;
    error.response = data;
    throw error;
  }

  return data;
}

function getUploadApiConfig() {
  const apiUrl = import.meta.env.VITE_UPLOAD_API_URL || import.meta.env.VITE_ORDER_API_SUBMIT_URL?.replace(/\/orders$/, "/uploads") || "";
  const mode = (import.meta.env.VITE_UPLOAD_API_MODE || (apiUrl ? "real" : "dummy")).toLowerCase();
  return { apiUrl, mode };
}

function buildDummyAssetResponse(payload) {
  const safeName = String(payload?.name || "asset").replace(/\s+/g, "-").toLowerCase();
  const assetId = `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    success: true,
    assetId,
    orderId: payload?.orderId || null,
    url: `mock://uploads/${encodeURIComponent(payload?.orderId || "draft-order")}/${assetId}/${safeName}`,
    name: payload?.name || "asset",
    mimeType: payload?.mimeType || "application/octet-stream",
    size: payload?.size || null,
    kind: payload?.kind || "file",
  };
}

export async function uploadOrderAsset(payload) {
  const { apiUrl, mode } = getUploadApiConfig();

  if (mode === "real" && apiUrl) {
    return postFormData(apiUrl, buildUploadFormData(payload));
  }

  return buildDummyAssetResponse(payload);
}
