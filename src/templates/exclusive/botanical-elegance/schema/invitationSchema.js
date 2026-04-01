import schemaJson from "./schema.json";

export const defaultSchema = {
    slug: "botanical-elegance",
    guest: {
        name: schemaJson.guest?.name ?? "",
    },
    groom: {
        ...schemaJson.groom,
    },
    bride: {
        ...schemaJson.bride,
    },
    event: {
        ...schemaJson.event,
        akad: {
            ...(schemaJson.event?.akad || {}),
        },
        resepsi: {
            ...(schemaJson.event?.resepsi || {}),
        },
    },
    gallery: Array.isArray(schemaJson.gallery) ? [...schemaJson.gallery] : [],
    streaming: {
        ...schemaJson.streaming,
    },
    gifts: {
        ...schemaJson.gifts,
        bankAccounts: Array.isArray(schemaJson.gifts?.bankAccounts) ? [...schemaJson.gifts.bankAccounts] : [],
        shipping: {
            ...(schemaJson.gifts?.shipping || {}),
        },
    },
    wishes: Array.isArray(schemaJson.wishes) ? [...schemaJson.wishes] : [],
    loveStory: Array.isArray(schemaJson.loveStory) ? [...schemaJson.loveStory] : [],
    copy: {
        ...(schemaJson.copy || {}),
    },
    features: {
        ...(schemaJson.features || {}),
        digitalEnvelopeEnabled: schemaJson.features?.digitalEnvelopeEnabled ?? true,
        rsvpEnabled: schemaJson.features?.rsvpEnabled ?? true,
        digitalEnvelopeInfo: {
            bankList: Array.isArray(schemaJson.gifts?.bankAccounts) ? [...schemaJson.gifts.bankAccounts] : [],
            shipping: {
                ...(schemaJson.gifts?.shipping || {}),
            },
        },
    },
    couple: {
        groom: {
            nickName: schemaJson.groom?.nickName || "Habib",
            nameFull: schemaJson.groom?.fullName || "Habib Yulianto",
            parentInfo: schemaJson.groom?.parentInfo || "Putri Pertama dari Bapak Andri Setiawan & Ibu Eva Naryanti",
            instagram: schemaJson.groom?.instagram || "https://www.instagram.com/",
        },
        bride: {
            nickName: schemaJson.bride?.nickName || "Adiba",
            nameFull: schemaJson.bride?.fullName || "Adiba Putri Syakila",
            parentInfo: schemaJson.bride?.parentInfo || "Putri Pertama dari Bapak Andri Setiawan & Ibu Eva Naryanti",
            instagram: schemaJson.bride?.instagram || "https://www.instagram.com/",
        },
    },
};

export default defaultSchema;
