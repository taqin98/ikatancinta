import { useEffect, useMemo, useState } from "react";
import {
  fetchPackages,
  fetchThemeByPresetId,
  fetchThemeBySlug,
  fetchThemeInvitations,
  fetchThemes,
} from "../services/catalogApi";

function useAsyncValue(loader, deps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const result = await loader();
        if (!active) return;
        setData(result);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "UNKNOWN_ERROR");
      } finally {
        if (active) setLoading(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, deps);

  return { data, loading, error };
}

export function usePackageCatalog() {
  const result = useAsyncValue(() => fetchPackages(), []);
  return {
    ...result,
    packages: result.data || [],
  };
}

export function useThemeCatalog(filters = {}) {
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  const result = useAsyncValue(() => fetchThemes(filters), [filterKey]);
  return {
    ...result,
    themes: result.data || [],
  };
}

export function useThemeBySlug(slug) {
  const result = useAsyncValue(() => fetchThemeBySlug(slug), [slug]);
  return {
    ...result,
    theme: result.data,
  };
}

export function useThemeByPresetId(presetId) {
  const result = useAsyncValue(() => fetchThemeByPresetId(presetId), [presetId]);
  return {
    ...result,
    theme: result.data,
  };
}

export function useThemeInvitations(slug) {
  const result = useAsyncValue(() => fetchThemeInvitations(slug), [slug]);
  return {
    ...result,
    invitations: result.data || [],
  };
}
