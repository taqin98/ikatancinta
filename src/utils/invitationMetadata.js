const ORDER_STATUSES = ["pending", "processing", "published", "done", "cancelled"];
const PUBLICLY_ACCESSIBLE_STATUSES = new Set(["published", "done"]);

export function pickText(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object") continue;
    const text = String(value).replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  return "";
}

export function normalizeThemeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

export function normalizePublicationStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-");
}

function isExplicitFalse(value) {
  return value === false || value === 0 || value === "0" || value === "false" || value === "no";
}

function isExplicitTrue(value) {
  return value === true || value === 1 || value === "1" || value === "true" || value === "yes";
}

export function isInvitationPubliclyAccessible(invitationData) {
  if (!invitationData || typeof invitationData !== "object") return false;

  const statusCandidates = [
    invitationData?.status,
    invitationData?.publishStatus,
    invitationData?.invitation?.status,
    invitationData?.invitation?.publishStatus,
    invitationData?.orderStatus,
    invitationData?.order?.status,
  ]
    .map(normalizePublicationStatus)
    .filter(Boolean);

  const knownOrderStatus = statusCandidates.find((status) => ORDER_STATUSES.includes(status));
  if (knownOrderStatus) {
    return PUBLICLY_ACCESSIBLE_STATUSES.has(knownOrderStatus);
  }

  const publishFlags = [
    invitationData?.isPublished,
    invitationData?.published,
    invitationData?.invitation?.isPublished,
    invitationData?.invitation?.published,
  ];

  if (publishFlags.some(isExplicitFalse)) return false;
  if (publishFlags.some(isExplicitTrue)) return true;

  const publishedAtCandidates = [
    invitationData?.publishedAt,
    invitationData?.publishAt,
    invitationData?.invitation?.publishedAt,
    invitationData?.invitation?.publishAt,
  ];

  if (publishedAtCandidates.some((value) => String(value || "").trim())) {
    return true;
  }

  // Inference: if publication metadata is absent, preserve existing live behavior.
  return true;
}

export function resolveInvitationPackageTier(data, fallback = "") {
  return pickText(
    data?.selectedPackage?.tier,
    data?.packageTier,
    data?.selectedTheme?.packageTier,
    data?.theme?.packageTier,
    data?.order?.packageTier,
    data?.data?.packageTier,
    fallback
  );
}

function toTitleCaseWord(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";
}

export function humanizeInvitationSlug(slug) {
  const parts = String(slug || "")
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 2) {
    return `${toTitleCaseWord(parts[0])} & ${toTitleCaseWord(parts[1])}`;
  }

  return parts.map(toTitleCaseWord).join(" ") || "Undangan";
}

export function resolveInvitationCoupleLabel(data, fallbackSlug = "") {
  const groomName = pickText(
    data?.couple?.groom?.nickName,
    data?.couple?.groom?.nameFull,
    data?.groom?.nickName,
    data?.groom?.fullName
  );
  const brideName = pickText(
    data?.couple?.bride?.nickName,
    data?.couple?.bride?.nameFull,
    data?.bride?.nickName,
    data?.bride?.fullName
  );

  if (groomName && brideName) {
    return `${groomName} & ${brideName}`;
  }

  return pickText(
    data?.copy?.heroCouple,
    data?.copy?.openingGreeting,
    data?.title,
    humanizeInvitationSlug(fallbackSlug)
  );
}
