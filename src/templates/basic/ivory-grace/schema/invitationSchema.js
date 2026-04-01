import contentDefaults from "./content.json";
import behaviorDefaults from "./behavior.json";

/** @type {import('../../../premium/blue-nature/schema/invitationSchema').defaultSchema & {behavior?: object}} */
export const defaultSchema = {
    guest: {
        name: contentDefaults?.guest?.name ?? "",
        greetingLabel: contentDefaults?.guest?.greetingLabel || "DEAR",
        code: "",
    },
    couple: {
        groom: {
            nameFull: contentDefaults?.couple?.groom?.nameFull || "Habib Yulianto",
            nickName: contentDefaults?.couple?.groom?.nickName || "Habib",
            instagram: contentDefaults?.couple?.groom?.instagram || "wekita.id",
            photo: "",
            parentInfo: contentDefaults?.couple?.groom?.parentInfo || "Putra dari Bapak Putra & Ibu Putri",
        },
        bride: {
            nameFull: contentDefaults?.couple?.bride?.nameFull || "Adiba Putri Syakila",
            nickName: contentDefaults?.couple?.bride?.nickName || "Adiba",
            instagram: contentDefaults?.couple?.bride?.instagram || "wekita.id",
            photo: "",
            parentInfo: contentDefaults?.couple?.bride?.parentInfo || "Putri dari Bapak Putra & Ibu Putri",
        },
        heroPhoto: "",
    },
    event: {
        dateISO: contentDefaults?.event?.dateISO || "2025-03-30T10:00:00+07:00",
        akad: {
            date: contentDefaults?.event?.akad?.date || "Minggu, 30 Maret 2025",
            time: contentDefaults?.event?.akad?.time || "09.00 WIB",
            venueName: "",
            address: contentDefaults?.event?.akad?.address || "Simpang Lima Gumul, Kediri",
            mapsUrl: contentDefaults?.event?.akad?.mapsUrl || "https://maps.google.com",
        },
        resepsi: {
            date: contentDefaults?.event?.resepsi?.date || "Minggu, 30 Maret 2025",
            time: contentDefaults?.event?.resepsi?.time || "10.00 WIB",
            venueName: "",
            address: contentDefaults?.event?.resepsi?.address || "Simpang Lima Gumul, Kediri",
            mapsUrl: contentDefaults?.event?.resepsi?.mapsUrl || "https://maps.google.com",
        },
        livestream: {
            date: contentDefaults?.event?.livestream?.date || "Minggu, 30 Maret 2025",
            time: contentDefaults?.event?.livestream?.time || "10.00 WIB",
            platformLabel: contentDefaults?.event?.livestream?.platformLabel || "YouTube",
            url: contentDefaults?.event?.livestream?.url || "https://youtube.com",
        },
    },
    copy: {
        openingGreeting: contentDefaults?.copy?.openingGreeting || "THE WEDDING OF",
        openingText:
            contentDefaults?.copy?.openingText ||
            "Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i serta kerabat sekalian untuk menghadiri acara pernikahan kami.",
        quote: contentDefaults?.copy?.quote || "",
        quoteSource: contentDefaults?.copy?.quoteSource || "",
        wishesBackgroundPhoto: "",
        closingBackgroundPhoto: "",
        closingText: contentDefaults?.copy?.closingText || "",
        closingLabel: contentDefaults?.copy?.closingLabel || "KAMI YANG BERBAHAGIA",
        supportText: contentDefaults?.copy?.supportText || "",
    },
    lovestory: Array.isArray(contentDefaults?.lovestory) ? contentDefaults.lovestory : [],
    gallery: Array.isArray(contentDefaults?.gallery) ? contentDefaults.gallery : [],
    gift: {
        bankList: contentDefaults?.gift?.bankList || [],
        shipping: contentDefaults?.gift?.shipping || {
            recipient: "",
            phone: "",
            address: "",
        },
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
    wishes: contentDefaults?.wishes || { title: "Ucapan", initial: [] },
    behavior: behaviorDefaults,
};
