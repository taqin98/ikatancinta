/**
 * Guest query params helper
 *
 * Supported URL params:
 * - `to` or `nama`
 * - `gelar_depan` or `title_prefix` or `prefix`
 * - `gelar_belakang` or `title_suffix` or `suffix`
 * - `sapaan` or `greeting`
 *
 * Examples:
 * - `/undangan/anisa-rio?to=Agus`
 * - `/undangan/anisa-rio?to=Agus&gelar_depan=Dr.`
 * - `/undangan/anisa-rio?to=Agus&gelar_belakang=S.T.,%20M.Kom`
 * - `/undangan/anisa-rio?to=Agus&gelar_depan=Dr.&gelar_belakang=S.T.,%20M.Kom`
 * - `/undangan/anisa-rio?to=Agus&sapaan=Kepada%20Yth.`
 *
 * Result example:
 * - `Dr. Agus, S.T., M.Kom`
 */
function normalizeSegment(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripEdgeCommas(value) {
  return normalizeSegment(value).replace(/^,\s*|\s*,$/g, "");
}

export function buildGuestDisplayName({ name = "", prefix = "", suffix = "" } = {}) {
  const normalizedName = normalizeSegment(name);
  const normalizedPrefix = normalizeSegment(prefix);
  const normalizedSuffix = stripEdgeCommas(suffix);

  const fullName = [normalizedPrefix, normalizedName].filter(Boolean).join(" ").trim();
  if (!fullName) return "";
  if (!normalizedSuffix) return fullName;

  return `${fullName}, ${normalizedSuffix}`;
}

export function readGuestQueryParams(search = window.location.search) {
  const params = new URLSearchParams(search);

  const name = normalizeSegment(params.get("to") || params.get("nama") || "");
  const prefix = normalizeSegment(
    params.get("prefix") || params.get("gelar_depan") || params.get("title_prefix") || "",
  );
  const suffix = normalizeSegment(
    params.get("suffix") || params.get("gelar_belakang") || params.get("title_suffix") || "",
  );
  const greetingLabel = normalizeSegment(
    params.get("greeting") || params.get("sapaan") || "",
  );

  return {
    name: buildGuestDisplayName({ name, prefix, suffix }),
    prefix,
    suffix,
    greetingLabel,
  };
}

export function applyGuestQueryOverrides(invitationData, guestQuery = readGuestQueryParams()) {
  if (!invitationData) return invitationData;

  const nextGuest = { ...(invitationData.guest || {}) };
  if (guestQuery.name) {
    nextGuest.name = guestQuery.name;
  }
  if (guestQuery.greetingLabel) {
    nextGuest.greetingLabel = guestQuery.greetingLabel;
  }

  return {
    ...invitationData,
    guest: nextGuest,
  };
}
