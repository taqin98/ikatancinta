import { useState, useEffect } from "react";
import { loadInvitationDraft } from "../services/invitationDataBridge";
import { fetchInvitationBySlug } from "../services/invitationApi";
import { getDefaultSchemaBySlug } from "../templates/basic/schemas";

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
    const guestName = decodeURIComponent(params.get("to") || params.get("nama") || "");
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
                        const merged = { ...draft };
                        if (guestName) merged.guest = { ...merged.guest, name: guestName };
                        setData(merged);
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
                        const merged = { ...defaultSchema, ...json };
                        if (guestName) merged.guest = { ...merged.guest, name: guestName };
                        setData(merged);
                        setLoading(false);
                        return;
                    }
                }

                // 3. Fallback to defaultSchema
                const fallback = JSON.parse(JSON.stringify(defaultSchema));
                if (guestName) fallback.guest.name = guestName;
                setData(fallback);
            } catch (err) {
                console.warn("useInvitationData: failed to resolve data", err);
                const fallback = JSON.parse(JSON.stringify(defaultSchema));
                if (guestName) fallback.guest.name = guestName;
                setData(fallback);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        resolve();
    }, [fallbackSlug, guestName, isPreview, skipFetch, slug]);

    return { data, loading, error };
}
