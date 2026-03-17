import { useState, useEffect } from "react";
import { loadInvitationDraft } from "../services/invitationDataBridge";
import { fetchInvitationBySlug } from "../services/invitationApi";
import { getDefaultSchemaBySlug } from "../templates/basic/schemas";
import { applyGuestQueryOverrides, readGuestQueryParams } from "../utils/guestParams";

/**
 * Resolves invitation data with this priority:
 *   1. sessionStorage draft (if ?preview=1 in URL)
 *   2. API fetch by invitation slug (if VITE_INVITATION_API_URL is set)
 *   3. defaultSchema (demo / fallback)
 *
 * @param {string} [slug] — optional slug for API fetch
 * @param {{ fallbackSlug?: string, skipFetch?: boolean }} [options]
 * @returns {{ data: object, loading: boolean, error: string|null }}
 */
export function useInvitationData(slug, options = {}) {
    const params = new URLSearchParams(window.location.search);
    const isPreview = params.get("preview") === "1";
    const guestQuery = readGuestQueryParams(window.location.search);
    const fallbackSlug = options?.fallbackSlug || slug;
    const skipFetch = Boolean(options?.skipFetch);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function resolve() {
            setLoading(true);
            setError(null);
            const defaultSchema = getDefaultSchemaBySlug(fallbackSlug || slug);

            try {
                // 1. Preview mode: load from sessionStorage
                if (isPreview) {
                    const draft = loadInvitationDraft();
                    if (draft) {
                        setData(applyGuestQueryOverrides({ ...draft }, guestQuery));
                        setLoading(false);
                        return;
                    }
                }

                if (skipFetch) {
                    setData(null);
                    setLoading(false);
                    return;
                }

                // 2. API fetch (only if env var set and slug provided)
                if (slug) {
                    const json = await fetchInvitationBySlug(slug);
                    if (json) {
                        setData(applyGuestQueryOverrides({ ...defaultSchema, ...json }, guestQuery));
                        setLoading(false);
                        return;
                    }
                }

                // 3. Fallback to defaultSchema
                setData(applyGuestQueryOverrides(JSON.parse(JSON.stringify(defaultSchema)), guestQuery));
            } catch (err) {
                console.warn("useInvitationData: failed to resolve data", err);
                setData(applyGuestQueryOverrides(JSON.parse(JSON.stringify(defaultSchema)), guestQuery));
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        resolve();
    }, [fallbackSlug, guestQuery.greetingLabel, guestQuery.name, isPreview, skipFetch, slug]);

    return { data, loading, error };
}
