import schemaJson from "./schema.json";

export const defaultSchema = {
    slug: "velvet-burgundy",
    guest: {
        name: "Nama Tamu",
    },
    groom: {
        ...schemaJson.groom,
    },
    bride: {
        ...schemaJson.bride,
    },
    event: {
        ...schemaJson.event,
    },
    gallery: Array.isArray(schemaJson.gallery) ? [...schemaJson.gallery] : [],
    streaming: {
        ...schemaJson.streaming,
    },
    gifts: {
        ...schemaJson.gifts,
    },
    wishes: Array.isArray(schemaJson.wishes) ? [...schemaJson.wishes] : [],

    // compatibility for shared create-form mapper / preview flow
    couple: {
        groom: {
            nickName: schemaJson.groom?.nickName || "Habib",
            nameFull: schemaJson.groom?.fullName || "Habib Yulianto",
            parentInfo: schemaJson.groom?.parentInfo || "Putra Kedua Dari : Bapak Putra dan Ibu Putri",
            instagram: schemaJson.groom?.instagram || "wekita.id",
        },
        bride: {
            nickName: schemaJson.bride?.nickName || "Adiba",
            nameFull: schemaJson.bride?.fullName || "Adiba Putri Syakila",
            parentInfo: schemaJson.bride?.parentInfo || "Putri Pertama Dari : Bapak Putra dan Ibu Putri",
            instagram: schemaJson.bride?.instagram || "wekita.id",
        },
    },
    copy: {
        openingGreeting: "The Wedding Of",
        openingText: "Kami berharap Anda menjadi bagian dari hari istimewa kami.",
        quote:
            "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri...",
        quoteSource: "( QS. Ar-Rum 21 )",
        galleryTitle: "Our Gallery",
        giftTitle: "Wedding Gift",
        giftIntro:
            "Doa Restu Anda merupakan karunia yang sangat berarti bagi kami. Dan jika memberi adalah ungkapan tanda kasih Anda, Anda dapat memberi kado secara cashless.",
        wishesTitle: "Ucapan Sesuatu",
        closingTitle: "Terimakasih",
        closingText: "Telah menjadi bagian dari momen bahagia kami",
    },
    features: {
        digitalEnvelopeEnabled: true,
        rsvpEnabled: true,
        digitalEnvelopeInfo: {
            bankList: schemaJson.gifts?.bankAccounts || [],
            shipping: schemaJson.gifts?.shipping || {},
        },
    },
};

export default defaultSchema;
