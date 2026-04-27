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

function unwrapCollectionPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const candidate = payload.data ?? payload.items ?? payload.results ?? payload.themes ?? payload.packages;
  if (Array.isArray(candidate)) return candidate;
  if (candidate && typeof candidate === "object") return [candidate];

  return [];
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

const themeMediaBySlug = Object.fromEntries(
  themeSeed.map((theme) => [
    theme.slug,
    {
      thumbnail: theme.thumbnail || theme.image || "",
      image: theme.image || theme.thumbnail || "",
    },
  ]),
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

function applyThemeMediaOverrides(theme = {}) {
  const localMedia = themeMediaBySlug[theme.slug];
  if (!localMedia) return theme;

  return {
    ...theme,
    thumbnail: localMedia.thumbnail || theme.thumbnail || theme.image || "",
    image: localMedia.image || localMedia.thumbnail || theme.image || theme.thumbnail || "",
  };
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
    try {
      const baseUrl = getCatalogApiBaseUrl();
      const payload = unwrapCollectionPayload(await getJson(`${baseUrl}/packages`));
      if (payload.length > 0) {
        return normalizePackagePlans(payload);
      }

      console.warn("Catalog API returned empty package list, using local fallback.");
    } catch (error) {
      console.warn("Catalog API package request failed, using local fallback.", error);
    }
  }

  await wait();
  return cloneJson(normalizePackagePlans(packagePlans));
}

export async function fetchThemes(filters = {}) {
  if (shouldUseRealCatalogApi()) {
    try {
      const baseUrl = getCatalogApiBaseUrl();
      const query = buildThemeQuery(filters);
      const payload = unwrapCollectionPayload(await getJson(query ? `${baseUrl}/themes?${query}` : `${baseUrl}/themes`));
      if (payload.length > 0) {
        return payload.map((theme) => applyThemeMediaOverrides(theme));
      }

      console.warn("Catalog API returned empty theme list, using local fallback.", filters);
    } catch (error) {
      console.warn("Catalog API theme request failed, using local fallback.", error);
    }
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
    try {
      const baseUrl = getCatalogApiBaseUrl();
      const payload = unwrapCollectionPayload(
        await getJson(`${baseUrl}/themes/${encodeURIComponent(slug)}/invitations`),
      );
      if (payload.length > 0) {
        return payload;
      }

      console.warn("Catalog API returned empty invitation list, using local fallback.", slug);
    } catch (error) {
      console.warn("Catalog API invitation request failed, using local fallback.", error);
    }
  }

  await wait();
  return cloneJson(invitationsByTheme[slug] || []);
}
