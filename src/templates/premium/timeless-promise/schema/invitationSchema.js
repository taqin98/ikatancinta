/** @type {import('../../blue-nature/schema/invitationSchema').defaultSchema} */
export const defaultSchema = {
    guest: {
        name: "",
        greetingLabel: "Kepada Bapak/Ibu/Saudara/i",
        code: "",
    },
    couple: {
        frontCoverPhoto: "",
        groom: {
            nameFull: "Habib Yulianto",
            nickName: "Habib",
            instagram: "wekita.id",
            photo: "",
            parentInfo: "Putra Kedua Bapak M. Dawam & (Almh) Ibu Dewi Sudarwati",
        },
        bride: {
            nameFull: "Adiba Putri Syakila",
            nickName: "Adiba",
            instagram: "wekita.id",
            photo: "",
            parentInfo: "Putri Pertama Bapak Anas & Ibu Kholifah",
        },
        heroPhoto: "",
    },
    event: {
        dateISO: "2025-03-30T10:00:00+07:00",
        akad: {
            date: "Minggu, 30 Maret 2025",
            time: "10.00 WIB",
            address: "Ds Pagu Kec. Wates Kab. Kediri",
            mapsUrl: "https://maps.google.com",
        },
        resepsi: {
            date: "Minggu, 30 Maret 2025",
            time: "10.00 WIB",
            address: "Ds Pagu Kec. Wates Kab. Kediri",
            mapsUrl: "https://maps.google.com",
        },
        livestream: {
            date: "Minggu, 30 Maret 2025",
            time: "10.00 WIB",
            platformLabel: "Instagram",
            url: "https://instagram.com",
        },
    },
    copy: {
        openingGreeting: "The Wedding Of",
        openingText:
            "Tanpa mengurangi rasa hormat. Kami mengundang Bapak/Ibu/Saudara/i serta kerabat sekalian untuk menghadiri acara pernikahan kami :",
        quote:
            "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya.",
        quoteSource: "QS. Ar-Rum (30): 21",
        closingText:
            "Merupakan suatu kehormatan dan kebahagiaan bagi kami, apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Atas kehadiran dan doa restunya, kami mengucapkan terima kasih.",
        saveTheDateBackgroundPhoto: "",
        wishesBackgroundPhoto: "",
        closingBackgroundPhoto: "",
    },
    lovestory: [
        {
            title: "Awal Cerita",
            date: "2020",
            text: "Berawal dari perkenalan sederhana, kami tumbuh bersama dalam perjalanan yang penuh syukur.",
            photo: "",
        },
        {
            title: "Lamaran",
            date: "2024",
            text: "Dengan restu keluarga, kami memantapkan hati untuk melangkah ke jenjang pernikahan.",
            photo: "",
        },
        {
            title: "Hari Istimewa",
            date: "2025",
            text: "InsyaAllah kami akan memulai kehidupan baru bersama dengan doa terbaik dari keluarga dan sahabat.",
            photo: "",
        },
    ],
    gallery: [],
    features: {
        countdownEnabled: true,
        saveTheDateEnabled: true,
        digitalEnvelopeEnabled: true,
        digitalEnvelopeInfo: {
            bankList: [
                { bank: "BCA", account: "1234 5678 90", name: "Habib" },
                { bank: "DANA", account: "1234 5678 90", name: "Habib" },
            ],
        },
        rsvpEnabled: true,
        livestreamEnabled: false,
    },
};
