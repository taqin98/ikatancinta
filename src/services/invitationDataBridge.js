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
 * @param {object|null} params.frontCoverImage — { url, name }
 * @param {object|null} params.coverImage  — { url, name }
 * @param {object|null} params.openingThumbnailImage — { url, name }
 * @param {object[]} params.galleryImages  — [{ url }]
 * @param {object[]} params.stories        — [{ title, description, date, photo }]
 * @param {string} params.quote
 * @param {string} params.quoteSource
 * @param {object|null} params.giftInfo
 * @param {object|null} params.saveTheDateBackgroundImage
 * @param {object|null} params.wishesBackgroundImage
 * @param {object|null} params.closingBackgroundImage
 * @param {object} params.selectedPackage
 * @param {object|null} params.selectedTheme
 * @param {string} params.musicMode
 * @param {object} params.selectedMusicTrack
 * @param {object|null} params.uploadedMusicFile
 * @param {object} params.defaultSchema
 * @returns {object} merged invitation data
 */
export function mapFormToInvitationSchema({
    groom,
    bride,
    akad,
    resepsi,
    livestream,
    isReceptionEnabled,
    frontCoverImage,
    coverImage,
    openingThumbnailImage,
    galleryImages,
    stories,
    quote,
    quoteSource,
    giftInfo,
    saveTheDateBackgroundImage,
    wishesBackgroundImage,
    closingBackgroundImage,
    selectedPackage,
    selectedTheme,
    musicMode,
    selectedMusicTrack,
    uploadedMusicFile,
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

    function inferStreamingLabel(url) {
        const raw = String(url || "").trim().toLowerCase();
        if (!raw) return defaultSchema.streaming?.label || "Live Streaming";
        if (raw.includes("youtube.com") || raw.includes("youtu.be")) return "YouTube Live";
        if (raw.includes("instagram.com")) return "Instagram Live";
        if (raw.includes("zoom.us")) return "Zoom Meeting";
        if (raw.includes("tiktok.com")) return "TikTok Live";
        return defaultSchema.streaming?.label || "Live Streaming";
    }

    const mappedAkad = {
        date: formatDateID(akad?.date) || defaultSchema.event.akad.date,
        time: formatTimeRange(akad?.startTime, akad?.endTime) || defaultSchema.event.akad.time,
        venueName: akad?.venue || defaultSchema.event.akad.venueName || "",
        address: akad?.address || defaultSchema.event.akad.address,
        mapsUrl: akad?.mapsLink || defaultSchema.event.akad.mapsUrl,
    };

    const mappedResepsi = isReceptionEnabled && resepsi
        ? {
            date: formatDateID(resepsi?.date) || defaultSchema.event.resepsi.date,
            time: formatTimeRange(resepsi?.startTime, resepsi?.endTime) || defaultSchema.event.resepsi.time,
            venueName: resepsi?.venue || defaultSchema.event.resepsi.venueName || "",
            address: resepsi?.address || defaultSchema.event.resepsi.address,
            mapsUrl: resepsi?.mapsLink || defaultSchema.event.resepsi.mapsUrl,
        }
        : defaultSchema.event.resepsi;

    const mappedLovestory = stories && stories.length > 0
        ? stories.map((s) => ({
            title: s.title || "Cerita Kita",
            text: s.description || "",
            date: s.date || "",
            photo: s.photo?.url || s.photo || "",
        }))
        : (defaultSchema.loveStory || defaultSchema.lovestory || []);

    const mappedGallery = galleryImages && galleryImages.length > 0
        ? galleryImages.map((img) => img.url)
        : defaultSchema.gallery;

    const packageCapabilities = selectedPackage?.capabilities || {};
    const isPuspaAsmaraTheme = selectedTheme?.slug === "puspa-asmara";
    const galleryLimit = selectedPackage?.limits?.galleryMax || mappedGallery.length;
    const mappedGiftBankList = Array.isArray(giftInfo?.bankList)
        ? giftInfo.bankList.filter((item) => item?.bank || item?.account || item?.name)
        : [];
    const mappedGiftShipping = {
        ...(defaultSchema.gift?.shipping || {}),
        ...(giftInfo?.shipping || {}),
    };
    const hasGiftData = mappedGiftBankList.length > 0 || Boolean(mappedGiftShipping.recipient || mappedGiftShipping.phone || mappedGiftShipping.address);
    const resolvedAudioSrc = musicMode === "upload"
        ? uploadedMusicFile?.dataUrl || defaultSchema.audio?.src || ""
        : selectedMusicTrack?.previewUrl || defaultSchema.audio?.src || "";
    const mappedStreaming = {
        ...(defaultSchema.streaming || {}),
        url: livestream?.url || defaultSchema.streaming?.url || "",
        label: inferStreamingLabel(livestream?.url),
        date: mappedAkad.date || defaultSchema.streaming?.date || "",
        time: mappedAkad.time || defaultSchema.streaming?.time || "",
    };

    return {
        ...defaultSchema,
        couple: {
            ...defaultSchema.couple,
            groom: {
                nameFull: groom?.fullname || defaultSchema.couple.groom.nameFull,
                nickName: groom?.nickname || (groom?.fullname?.split(" ")[0]) || defaultSchema.couple.groom.nickName,
                parentInfo: groom?.parents || defaultSchema.couple.groom.parentInfo,
                instagram: groom?.instagram || defaultSchema.couple.groom.instagram,
                photo: groom?.photo?.url || openingThumbnailImage?.url || coverImage?.url || defaultSchema.couple.groom.photo || "",
            },
            bride: {
                nameFull: bride?.fullname || defaultSchema.couple.bride.nameFull,
                nickName: bride?.nickname || (bride?.fullname?.split(" ")[0]) || defaultSchema.couple.bride.nickName,
                parentInfo: bride?.parents || defaultSchema.couple.bride.parentInfo,
                instagram: bride?.instagram || defaultSchema.couple.bride.instagram,
                photo: bride?.photo?.url || openingThumbnailImage?.url || coverImage?.url || defaultSchema.couple.bride.photo || "",
            },
            frontCoverPhoto: isPuspaAsmaraTheme
                ? frontCoverImage?.url || defaultSchema.couple.frontCoverPhoto || defaultSchema.couple.heroPhoto || ""
                : frontCoverImage?.url || coverImage?.url || defaultSchema.couple.frontCoverPhoto || defaultSchema.couple.heroPhoto || "",
            heroPhoto: openingThumbnailImage?.url || coverImage?.url || defaultSchema.couple.heroPhoto || "",
        },
        openingThumbnailImage,
        loveStory: packageCapabilities.loveStory === false ? [] : mappedLovestory,
        lovestory: packageCapabilities.loveStory === false ? [] : mappedLovestory,
        gallery: mappedGallery.slice(0, galleryLimit),
        streaming: mappedStreaming,
        gift: {
            ...(defaultSchema.gift || {}),
            bankList: hasGiftData ? mappedGiftBankList : [],
            shipping: hasGiftData ? mappedGiftShipping : {},
        },
        copy: {
            ...defaultSchema.copy,
            quote: quote || defaultSchema.copy?.quote || "",
            quoteSource: quoteSource || defaultSchema.copy?.quoteSource || "",
            saveTheDateBackgroundPhoto:
                saveTheDateBackgroundImage?.url || coverImage?.url || defaultSchema.copy?.saveTheDateBackgroundPhoto || "",
            wishesBackgroundPhoto:
                wishesBackgroundImage?.url || coverImage?.url || defaultSchema.copy?.wishesBackgroundPhoto || "",
            closingBackgroundPhoto: closingBackgroundImage?.url || coverImage?.url || defaultSchema.copy?.closingBackgroundPhoto || "",
        },
        features: {
            ...defaultSchema.features,
            digitalEnvelopeEnabled: Boolean(packageCapabilities.digitalEnvelope && hasGiftData),
            rsvpEnabled: packageCapabilities.rsvp ?? defaultSchema.features?.rsvpEnabled,
            livestreamEnabled: packageCapabilities.livestream ?? defaultSchema.features?.livestreamEnabled,
        },
        audio: {
            ...defaultSchema.audio,
            src: resolvedAudioSrc,
        },
        event: {
            ...defaultSchema.event,
            dateISO: buildDateISO(akad?.date, akad?.startTime),
            livestream: mappedStreaming,
            akad: {
                ...mappedAkad,
                coverPhoto: akad?.coverImage?.url || coverImage?.url || defaultSchema.event?.akad?.coverPhoto || "",
            },
            resepsi: {
                ...mappedResepsi,
                coverPhoto:
                    (isReceptionEnabled ? resepsi?.coverImage?.url : "") ||
                    akad?.coverImage?.url ||
                    coverImage?.url ||
                    defaultSchema.event?.resepsi?.coverPhoto ||
                    "",
            },
        },
    };
}
