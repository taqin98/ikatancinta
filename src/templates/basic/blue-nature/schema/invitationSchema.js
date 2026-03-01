/** @type {import('../../light-blue-floral/schema/invitationSchema').defaultSchema} */
export const defaultSchema = {
    guest: {
        name: "Nama Tamu",
        greetingLabel: "Kepada Bapak/Ibu/Saudara/i",
        code: "",
    },
    couple: {
        groom: {
            nameFull: "Habib Yulianto",
            nickName: "Habib",
            instagram: "habibyulianto",
            photo: "",
            parentInfo: "Putra dari Bapak H. M. Dawam & Ibu Dewi Sudarwati (Almh)",
        },
        bride: {
            nameFull: "Adiba Putri Syakila",
            nickName: "Adiba",
            instagram: "adibaputris",
            photo: "",
            parentInfo: "Putri dari Bapak Anas Rifai & Ibu Kholifah",
        },
        heroPhoto: "",
    },
    event: {
        dateISO: "2026-06-12T10:00:00",
        akad: {
            date: "Jumat, 12 Juni 2026",
            time: "10.00 WIB - Selesai",
            address: "Sportorium UMY, Jl. Brawijaya, Ngebel, Tamantirto, Kec. Kasihan, Kabupaten Bantul, DIY",
            mapsUrl: "https://maps.google.com",
        },
        resepsi: {
            date: "Jumat, 12 Juni 2026",
            time: "13.00 WIB - 16.00 WIB",
            address: "Sportorium UMY, Jl. Brawijaya, Ngebel, Tamantirto, Kec. Kasihan, Kabupaten Bantul, DIY",
            mapsUrl: "https://maps.google.com",
        },
        livestream: {
            date: "Jumat, 12 Juni 2026",
            time: "10.00 WIB",
            platformLabel: "Instagram Live",
            url: "https://www.instagram.com/",
        },
    },
    copy: {
        openingGreeting: "The Wedding Of",
        openingText:
            "Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i serta kerabat sekalian untuk menghadiri acara pernikahan kami.",
        quote:
            "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.",
        quoteSource: "Qs. Ar-Rum (30): 21",
        closingText:
            "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Atas kehadiran dan doa restunya kami mengucapkan terima kasih.",
    },
    lovestory: [
        {
            title: "Awal Bertemu",
            date: "2019",
            text: "Kami dipertemukan dalam sebuah momen sederhana. Obrolan yang awalnya singkat berubah menjadi perjalanan panjang yang penuh makna.",
            photo: "",
        },
        {
            title: "Lamaran",
            date: "2025",
            text: "Dengan restu keluarga, kami mengikat janji untuk melangkah ke jenjang yang lebih serius dan menata masa depan bersama.",
            photo: "",
        },
        {
            title: "Pernikahan",
            date: "2026",
            text: "InsyaAllah kami akan memulai babak baru sebagai pasangan suami istri dengan doa terbaik dari keluarga dan sahabat tercinta.",
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
                { bank: "BCA", account: "1234567890", name: "Habib Yulianto" },
                { bank: "DANA", account: "081234567890", name: "Habib Yulianto" },
            ],
        },
        rsvpEnabled: true,
        livestreamEnabled: true,
    },
};
