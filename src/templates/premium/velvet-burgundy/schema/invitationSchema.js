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
        akad: {
            ...(schemaJson.event?.akad || {}),
            venueName: schemaJson.event?.akad?.venueName || "",
            coverPhoto: schemaJson.event?.akad?.coverPhoto || "assets/images/local/wp-content__uploads__2024__09__foto-1-6.jpg",
        },
        resepsi: {
            ...(schemaJson.event?.resepsi || {}),
            venueName: schemaJson.event?.resepsi?.venueName || "",
            coverPhoto: schemaJson.event?.resepsi?.coverPhoto || "assets/images/local/wp-content__uploads__2024__09__sm-sm-1-5.jpg",
        },
    },
    lovestory: [
        {
            date: "6 DESEMBER 2022",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
            photo: "",
        },
        {
            date: "16 DESEMBER 2022",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
            photo: "",
        },
        {
            date: "26 DESEMBER 2022",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
            photo: "",
        },
    ],
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
            photo: "assets/images/local/wp-content__uploads__2024__09__Picture1.webp",
        },
        bride: {
            nickName: schemaJson.bride?.nickName || "Adiba",
            nameFull: schemaJson.bride?.fullName || "Adiba Putri Syakila",
            parentInfo: schemaJson.bride?.parentInfo || "Putri Pertama Dari : Bapak Putra dan Ibu Putri",
            instagram: schemaJson.bride?.instagram || "wekita.id",
            photo: "assets/images/local/wp-content__uploads__2024__09__Picture1x.webp",
        },
        frontCoverPhoto: "assets/images/local/wp-content__uploads__2024__09__sm-1-5-1-e1725518237570.jpg",
        heroPhoto: "assets/images/local/wp-content__uploads__2024__09__04-1-1.webp",
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
        closingBackgroundPhoto: "assets/images/local/wp-content__uploads__2024__09__04-1-1.webp",
    },
    gift: {
        bankList: schemaJson.gifts?.bankAccounts || [],
        shipping: schemaJson.gifts?.shipping || {},
    },
    features: {
        digitalEnvelopeEnabled: true,
        rsvpEnabled: true,
        livestreamEnabled: false,
        digitalEnvelopeInfo: {
            bankList: schemaJson.gifts?.bankAccounts || [],
            shipping: schemaJson.gifts?.shipping || {},
        },
    },
};

export default defaultSchema;
