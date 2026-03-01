/**
 * sessionStorage bridge for passing invitation form data to the template preview.
 *
 * Flow:
 *   CreateInvitationFormPage → saveInvitationDraft(mapped) → open template with ?preview=1
 *   Template Basic (by slug) → loadInvitationDraft() → merge with resolved defaultSchema
 */

const STORAGE_KEY = "ikc_invitation_draft";

/** @param {object} data — invitation schema object to persist */
export function saveInvitationDraft(data) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn("saveInvitationDraft: sessionStorage write failed", e);
    }
}

/** @returns {object|null} */
export function loadInvitationDraft() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.warn("loadInvitationDraft: parse failed", e);
        return null;
    }
}

export function clearInvitationDraft() {
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}

/**
 * Map the raw CreateInvitationFormPage state to the active Basic template schema.
 * Merges with defaultSchema so any missing fields fall back gracefully.
 *
 * @param {object} params
 * @param {object} params.groom
 * @param {object} params.bride
 * @param {object} params.akad
 * @param {object|null} params.resepsi
 * @param {boolean} params.isReceptionEnabled
 * @param {object|null} params.coverImage  — { url, name }
 * @param {object[]} params.galleryImages  — [{ url }]
 * @param {object[]} params.stories        — [{ title, description, date }]
 * @param {object} params.defaultSchema
 * @returns {object} merged invitation data
 */
export function mapFormToInvitationSchema({
    groom,
    bride,
    akad,
    resepsi,
    isReceptionEnabled,
    coverImage,
    galleryImages,
    stories,
    defaultSchema,
}) {
    // Format date string: "2026-05-15" → "Jumat, 15 Mei 2026"
    function formatDateID(iso) {
        if (!iso) return "";
        try {
            return new Intl.DateTimeFormat("id-ID", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
            }).format(new Date(iso));
        } catch {
            return iso;
        }
    }

    function formatTimeRange(start, end) {
        if (!start) return "";
        return end ? `${start.replace(":", ".")} – ${end.replace(":", ".")} WIB` : `${start.replace(":", ".")} WIB`;
    }

    // Build ISO datetime string for countdown
    function buildDateISO(dateStr, startTime) {
        if (!dateStr) return defaultSchema.event.dateISO;
        try {
            const time = startTime || "09:00";
            return new Date(`${dateStr}T${time}:00`).toISOString();
        } catch {
            return defaultSchema.event.dateISO;
        }
    }

    const mappedAkad = {
        date: formatDateID(akad?.date) || defaultSchema.event.akad.date,
        time: formatTimeRange(akad?.startTime, akad?.endTime) || defaultSchema.event.akad.time,
        address: [akad?.venue, akad?.address].filter(Boolean).join(", ") || defaultSchema.event.akad.address,
        mapsUrl: akad?.mapsLink || defaultSchema.event.akad.mapsUrl,
    };

    const mappedResepsi = isReceptionEnabled && resepsi
        ? {
            date: formatDateID(resepsi?.date) || defaultSchema.event.resepsi.date,
            time: formatTimeRange(resepsi?.startTime, resepsi?.endTime) || defaultSchema.event.resepsi.time,
            address: [resepsi?.venue, resepsi?.address].filter(Boolean).join(", ") || defaultSchema.event.resepsi.address,
            mapsUrl: resepsi?.mapsLink || defaultSchema.event.resepsi.mapsUrl,
        }
        : defaultSchema.event.resepsi;

    const mappedLovestory = stories && stories.length > 0
        ? stories.map((s) => ({
            title: s.title || "Cerita Kita",
            text: s.description || "",
            date: s.date || "",
            photo: "",
        }))
        : defaultSchema.lovestory;

    const mappedGallery = galleryImages && galleryImages.length > 0
        ? galleryImages.map((img) => img.url)
        : defaultSchema.gallery;

    return {
        ...defaultSchema,
        couple: {
            ...defaultSchema.couple,
            groom: {
                nameFull: groom?.fullname || defaultSchema.couple.groom.nameFull,
                nickName: groom?.nickname || (groom?.fullname?.split(" ")[0]) || defaultSchema.couple.groom.nickName,
                parentInfo: groom?.parents || defaultSchema.couple.groom.parentInfo,
                instagram: groom?.instagram || defaultSchema.couple.groom.instagram,
                photo: "",
            },
            bride: {
                nameFull: bride?.fullname || defaultSchema.couple.bride.nameFull,
                nickName: bride?.nickname || (bride?.fullname?.split(" ")[0]) || defaultSchema.couple.bride.nickName,
                parentInfo: bride?.parents || defaultSchema.couple.bride.parentInfo,
                instagram: bride?.instagram || defaultSchema.couple.bride.instagram,
                photo: "",
            },
            heroPhoto: coverImage?.url || "",
        },
        event: {
            ...defaultSchema.event,
            dateISO: buildDateISO(akad?.date, akad?.startTime),
            akad: mappedAkad,
            resepsi: mappedResepsi,
        },
        lovestory: mappedLovestory,
        gallery: mappedGallery,
    };
}
