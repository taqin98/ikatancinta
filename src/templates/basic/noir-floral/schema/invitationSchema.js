/** @type {import('../../light-blue-floral/schema/invitationSchema').defaultSchema} */
export const defaultSchema = {
    guest: {
        name: "Nama Tamu",
        greetingLabel: "Dear,",
        code: "",
    },
    couple: {
        groom: {
            nameFull: "Habib Yulianto",
            nickName: "Habib",
            instagram: "habibyulianto",
            photo: "",
            parentInfo: "Putra Kedua Bapak M. Dawam & Ibu Dewi Sudarwati",
        },
        bride: {
            nameFull: "Adiba Putri Syakila",
            nickName: "Adiba",
            instagram: "adibaputri",
            photo: "",
            parentInfo: "Putri Pertama Bapak Anas & Ibu Kholifah",
        },
        heroPhoto: "",
    },
    event: {
        dateISO: "2026-03-30T10:00:00",
        akad: {
            date: "Minggu, 30 Maret 2026",
            time: "10.00 WIB",
            address: "Ds Pagu Kec. Wates Kab. Kediri",
            mapsUrl: "https://maps.google.com",
        },
        resepsi: {
            date: "Minggu, 30 Maret 2026",
            time: "10.00 WIB",
            address: "Ds Pagu Kec. Wates Kab. Kediri",
            mapsUrl: "https://maps.google.com",
        },
        livestream: {
            date: "Minggu, 30 Maret 2026",
            time: "10.00 WIB",
            platformLabel: "Instagram",
            url: "https://instagram.com",
        },
    },
    copy: {
        openingGreeting: "We're Getting Married",
        openingText:
            "Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i serta kerabat sekalian untuk menghadiri acara pernikahan kami.",
        quote:
            "Dan segala sesuatu Kami ciptakan berpasang-pasangan agar kamu mengingat (kebesaran Allah).",
        quoteSource: "QS. Az-Zariyat 49",
        closingText:
            "Merupakan suatu kehormatan dan kebahagiaan bagi kami, apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Atas kehadiran dan doa restunya, kami mengucapkan terima kasih.",
    },
    lovestory: [
        {
            title: "Awal Cerita",
            date: "11-11-2017",
            text: "Berawal dari teman kuliah bersama-sama memperjuangkan S1 Teknik Sipil, bertemu pada tahun 2016 hingga selalu bertemu untuk sesekali makan bersama, lalu menjalin hubungan pacaran 11-11-2017.",
            photo: "",
        },
        {
            title: "Lamaran",
            date: "23-03-2019",
            text: "Pada tanggal 23-03-2019 kami mengikat diri pada pertunangan dan pada tanggal 29-10-2020 kami mengadakan akad nikah. Alhamdulillah perjalanan ini sampai pada akhirnya.",
            photo: "",
        },
        {
            title: "Resepsi Pernikahan",
            date: "30-03-2026",
            text: "Kami bisa melakukan acara resepsi yang insyaAllah diadakan pada Minggu, 30 Maret 2026.",
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
