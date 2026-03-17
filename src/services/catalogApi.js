import {
  getThemeByPresetId as getThemeByPresetIdFromSeed,
  getThemeBySlug as getThemeBySlugFromSeed,
  invitationsByTheme,
  themes as themeSeed,
} from "../data/themes";
import { normalizePackageTier, packagePlans } from "../data/packageCatalog";

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
    const error = new Error(`CATALOG_API_REQUEST_FAILED: ${message}`);
    error.status = response.status;
    error.response = data;
    throw error;
  }

  return data;
}

function getCatalogApiBaseUrl() {
  return import.meta.env.VITE_CATALOG_API_URL || "";
}

function shouldUseRealCatalogApi() {
  const mode = (import.meta.env.VITE_CATALOG_API_MODE || "dummy").toLowerCase();
  return mode === "real" && Boolean(getCatalogApiBaseUrl());
}

const packagePlanByTier = Object.fromEntries(
  packagePlans.map((plan) => [normalizePackageTier(plan.tier), plan]),
);

function normalizePackagePlan(rawPlan = {}, index = 0) {
  const fallbackPlan = packagePlans[index] || packagePlans[0];
  const tier = normalizePackageTier(rawPlan?.tier || rawPlan?.packageTier || rawPlan?.name || fallbackPlan?.tier);
  const defaultPlan = packagePlanByTier[tier] || fallbackPlan || packagePlans[0];

  return {
    ...defaultPlan,
    ...rawPlan,
    tier,
    name: rawPlan?.name || defaultPlan?.name || tier,
    description: rawPlan?.description || defaultPlan?.description || "",
    discount: rawPlan?.discount || rawPlan?.discountLabel || defaultPlan?.discount || "",
    cta: rawPlan?.cta || defaultPlan?.cta || `Pilih ${rawPlan?.name || defaultPlan?.name || tier}`,
    highlighted: rawPlan?.highlighted ?? defaultPlan?.highlighted ?? false,
    features: Array.isArray(rawPlan?.features)
      ? rawPlan.features
      : Array.isArray(rawPlan?.featureList)
        ? rawPlan.featureList
        : defaultPlan?.features || [],
    limits: {
      ...(defaultPlan?.limits || {}),
      ...(rawPlan?.limits || {}),
    },
    capabilities: {
      ...(defaultPlan?.capabilities || {}),
      ...(rawPlan?.capabilities || {}),
    },
  };
}

function normalizePackagePlans(rawPackages) {
  if (!Array.isArray(rawPackages)) return cloneJson(packagePlans);
  return rawPackages.map((plan, index) => normalizePackagePlan(plan, index));
}

function applyThemeFilters(items, filters = {}) {
  return items.filter((theme) => {
    if (filters.packageTier && theme.packageTier !== normalizePackageTier(filters.packageTier)) return false;
    if (filters.slug && theme.slug !== filters.slug) return false;
    if (filters.presetId && theme.presetId !== filters.presetId) return false;
    if (filters.category && theme.category !== filters.category) return false;
    return true;
  });
}

function buildThemeQuery(filters = {}) {
  const params = new URLSearchParams();
  if (filters.packageTier) params.set("packageTier", normalizePackageTier(filters.packageTier));
  if (filters.slug) params.set("slug", filters.slug);
  if (filters.presetId) params.set("presetId", filters.presetId);
  if (filters.category) params.set("category", filters.category);
  return params.toString();
}

export async function fetchPackages() {
  if (shouldUseRealCatalogApi()) {
    const baseUrl = getCatalogApiBaseUrl();
    return normalizePackagePlans(await getJson(`${baseUrl}/packages`));
  }

  await wait();
  return cloneJson(normalizePackagePlans(packagePlans));
}

export async function fetchThemes(filters = {}) {
  if (shouldUseRealCatalogApi()) {
    const baseUrl = getCatalogApiBaseUrl();
    const query = buildThemeQuery(filters);
    return getJson(query ? `${baseUrl}/themes?${query}` : `${baseUrl}/themes`);
  }

  await wait();
  return cloneJson(applyThemeFilters(themeSeed, filters));
}

export async function fetchThemeBySlug(slug) {
  if (!slug) return null;

  if (shouldUseRealCatalogApi()) {
    const result = await fetchThemes({ slug });
    return Array.isArray(result) ? result[0] || null : result;
  }

  await wait();
  return cloneJson(getThemeBySlugFromSeed(slug));
}

export async function fetchThemeByPresetId(presetId) {
  if (!presetId) return null;

  if (shouldUseRealCatalogApi()) {
    const result = await fetchThemes({ presetId });
    return Array.isArray(result) ? result[0] || null : result;
  }

  await wait();
  return cloneJson(getThemeByPresetIdFromSeed(presetId));
}

export async function fetchThemeInvitations(slug) {
  if (!slug) return [];

  if (shouldUseRealCatalogApi()) {
    const baseUrl = getCatalogApiBaseUrl();
    return getJson(`${baseUrl}/themes/${encodeURIComponent(slug)}/invitations`);
  }

  await wait();
  return cloneJson(invitationsByTheme[slug] || []);
}
