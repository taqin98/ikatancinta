/** @type {import('../../light-blue-floral/schema/invitationSchema').defaultSchema} */
export const defaultSchema = {
    guest: {
        name: "Nama Tamu",
        greetingLabel: "Kepada Bapak/Ibu/Saudara/i",
        code: "",
    },
    couple: {
        groom: {
            nameFull: "Muhammad Habib Al-Farouq",
            nickName: "Habib",
            instagram: "habib.alfarouq",
            photo: "",
            parentInfo: "Putra pertama dari Bapak H. Ahmad Farouq & Ibu Hj. Siti Rahmah",
        },
        bride: {
            nameFull: "Adiba Zahra Putri",
            nickName: "Adiba",
            instagram: "adiba.zahra",
            photo: "",
            parentInfo: "Putri bungsu dari Bapak H. Zainal Abidin & Ibu Hj. Nurul Hidayah",
        },
        heroPhoto: "",
    },
    event: {
        dateISO: "2026-05-15T09:00:00",
        akad: {
            date: "Jumat, 15 Mei 2026",
            time: "09.00 WIB",
            address: "Masjid Al-Barkah, Jl. Masjid No. 1, Bekasi Selatan",
            mapsUrl: "https://maps.google.com",
        },
        resepsi: {
            date: "Sabtu, 16 Mei 2026",
            time: "11.00 - 15.00 WIB",
            address: "Gedung Graha Famili, Jl. Graha Famili No. 5, Surabaya",
            mapsUrl: "https://maps.google.com",
        },
        livestream: {
            date: "Sabtu, 16 Mei 2026",
            time: "11.00 WIB",
            platformLabel: "YouTube Live",
            url: "https://youtube.com/live/example",
        },
    },
    copy: {
        openingGreeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
        openingText:
            "Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu di hari pernikahan kami.",
        quote:
            "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
        quoteSource: "QS. Ar-Rum: 21",
        closingText:
            "Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir. Atas kehadiran dan doa restunya, kami ucapkan terima kasih.",
    },
    lovestory: [
        {
            title: "Awal Cerita",
            date: "2019",
            text: "Perkenalan kami dimulai dari sebuah pertemuan sederhana yang tak terduga, dua jiwa yang dipertemukan dalam satu momen tak terlupakan.",
            photo: "",
        },
        {
            title: "Lamaran",
            date: "2025",
            text: "Dengan penuh rasa syukur, satu pertanyaan sederhana dan sebuah iya yang tulus menjadi awal dari babak baru perjalanan hidup kami bersama.",
            photo: "",
        },
        {
            title: "Resepsi",
            date: "Mei 2026",
            text: "Dan kini, kami siap melangkah bersama menuju kehidupan rumah tangga, dengan cinta, doa, dan restu orang-orang terkasih.",
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
                { bank: "BCA", account: "1234567890", name: "Muhammad Habib Al-Farouq" },
                { bank: "Mandiri", account: "0987654321", name: "Adiba Zahra Putri" },
            ],
        },
        rsvpEnabled: true,
        livestreamEnabled: true,
    },
};
