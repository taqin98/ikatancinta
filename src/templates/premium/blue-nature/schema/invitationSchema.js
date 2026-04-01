import contentDefaults from "./content.json";
import behaviorDefaults from "./behavior.json";

/** @type {import('./invitationSchema').defaultSchema & {behavior?: object}} */
export const defaultSchema = {
    invitation: {
        slug: "blue-nature",
        orderId: "",
    },
    guest: {
        name: contentDefaults?.guest?.name ?? "",
        greetingLabel: contentDefaults?.guest?.greetingLabel || "Kepada Bapak/Ibu/Saudara/i",
        code: "",
    },
    couple: {
        groom: {
            nameFull: contentDefaults?.couple?.groom?.nameFull || "Habib Yulianto",
            nickName: contentDefaults?.couple?.groom?.nickName || "Habib",
            instagram: contentDefaults?.couple?.groom?.instagram || "habibyulianto",
            photo: contentDefaults?.couple?.groom?.photo || "",
            parentInfo: contentDefaults?.couple?.groom?.parentInfo || "Putra dari Bapak Putra & Ibu Putri",
        },
        bride: {
            nameFull: contentDefaults?.couple?.bride?.nameFull || "Adiba Putri Syakila",
            nickName: contentDefaults?.couple?.bride?.nickName || "Adiba",
            instagram: contentDefaults?.couple?.bride?.instagram || "adibaputris",
            photo: contentDefaults?.couple?.bride?.photo || "",
            parentInfo: contentDefaults?.couple?.bride?.parentInfo || "Putri dari Bapak Putra & Ibu Putri",
        },
        frontCoverPhoto: contentDefaults?.couple?.frontCoverPhoto || contentDefaults?.couple?.heroPhoto || "",
        heroPhoto: contentDefaults?.couple?.heroPhoto || "",
    },
    event: {
        dateISO: contentDefaults?.event?.dateISO || "2026-06-12T10:00:00+07:00",
        akad: {
            date: contentDefaults?.event?.akad?.date || "Jumat, 12 Juni 2026",
            time: contentDefaults?.event?.akad?.time || "10.00 WIB - Selesai",
            venueName: contentDefaults?.event?.akad?.venueName || "",
            address: contentDefaults?.event?.akad?.address || "Sportorium UMY, Yogyakarta",
            mapsUrl: contentDefaults?.event?.akad?.mapsUrl || "https://maps.google.com",
        },
        resepsi: {
            date: contentDefaults?.event?.resepsi?.date || "Jumat, 12 Juni 2026",
            time: contentDefaults?.event?.resepsi?.time || "13.00 WIB - 16.00 WIB",
            venueName: contentDefaults?.event?.resepsi?.venueName || "",
            address: contentDefaults?.event?.resepsi?.address || "Sportorium UMY, Yogyakarta",
            mapsUrl: contentDefaults?.event?.resepsi?.mapsUrl || "https://maps.google.com",
        },
        livestream: {
            date: contentDefaults?.event?.livestream?.date || "Jumat, 12 Juni 2026",
            time: contentDefaults?.event?.livestream?.time || "10.00 WIB",
            platformLabel: contentDefaults?.event?.livestream?.platformLabel || "Instagram Live",
            url: contentDefaults?.event?.livestream?.url || "https://www.instagram.com/",
        },
    },
    copy: {
        openingGreeting: contentDefaults?.copy?.openingGreeting || "The Wedding Of",
        openingText:
            contentDefaults?.copy?.openingText ||
            "Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i serta kerabat sekalian untuk menghadiri acara pernikahan kami.",
        quote: contentDefaults?.copy?.quote || "",
        quoteSource: contentDefaults?.copy?.quoteSource || "",
        saveTheDateBackgroundPhoto: contentDefaults?.copy?.saveTheDateBackgroundPhoto || "",
        wishesBackgroundPhoto: contentDefaults?.copy?.wishesBackgroundPhoto || "",
        closingBackgroundPhoto: contentDefaults?.copy?.closingBackgroundPhoto || "",
        closingLabel: contentDefaults?.copy?.closingLabel || "Kami Yang Berbahagia",
        closingText: contentDefaults?.copy?.closingText || "",
        supportText: contentDefaults?.copy?.supportText || "Support with ❤ by ikatancinta.in",
    },
    lovestory: Array.isArray(contentDefaults?.lovestory) ? contentDefaults.lovestory : [],
    gallery: Array.isArray(contentDefaults?.gallery) ? contentDefaults.gallery : [],
    gift: {
        bankList: contentDefaults?.gift?.bankList || [],
        shipping: contentDefaults?.gift?.shipping || {},
    },
    features: {
        countdownEnabled: true,
        saveTheDateEnabled: true,
        digitalEnvelopeEnabled: true,
        digitalEnvelopeInfo: {
            bankList: contentDefaults?.gift?.bankList || [],
        },
        rsvpEnabled: true,
        livestreamEnabled: true,
    },
    audio: {
        src: contentDefaults?.audio?.src || "",
        autoplay: Boolean(contentDefaults?.audio?.autoplay),
        loop: contentDefaults?.audio?.loop !== false,
    },
    wishes: contentDefaults?.wishes || { title: "Wishes", initial: [] },
    behavior: behaviorDefaults,
};

export default defaultSchema;
