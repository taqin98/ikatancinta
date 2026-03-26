/** @type {import('../../blue-nature/schema/invitationSchema').defaultSchema} */
export const defaultSchema = {
    invitation: {
        slug: "misty-romance",
        orderId: "",
    },
    guest: {
        name: "Nama Tamu",
        greetingLabel: "Kepada Yth,",
        code: "",
    },
    couple: {
        groom: {
            nameFull: "Habib Yulianto",
            nickName: "Habib",
            instagram: "habibyulianto",
            photo: "assets/images/couple/groom.jpg",
            parentInfo: "Putra Ketiga dari Bapak Putra & Ibu Putri",
        },
        bride: {
            nameFull: "Adiba Putri Syakila",
            nickName: "Adiba",
            instagram: "adibaputris",
            photo: "assets/images/couple/bride.jpg",
            parentInfo: "Putri Ketiga dari Bapak Putra & Ibu Putri",
        },
        frontCoverPhoto: "assets/images/cover/fres-948-3-1.jpg",
        heroPhoto: "assets/images/gallery/gallery-03.jpg",
    },
    event: {
        dateISO: "2026-05-01T10:00:00+07:00",
        akad: {
            date: "Minggu, 29 Desember 2024",
            time: "09.00 WIB",
            venueName: "Kediaman Mempelai Wanita",
            address: "Ds Pagu Kec. Wates Kab. Kediri, Jawa Timur",
            mapsUrl: "https://maps.app.goo.gl/wNyFkeGRv7bmDs8t8?g_st=ic",
            coverPhoto: "assets/images/cover/hitam-5-1.webp",
        },
        resepsi: {
            date: "Minggu, 29 Desember 2024",
            time: "12.00 WIB - Selesai",
            venueName: "Kediaman Mempelai Wanita",
            address: "Ds Pagu Kec. Wates Kab. Kediri, Jawa Timur",
            mapsUrl: "https://maps.app.goo.gl/wNyFkeGRv7bmDs8t8?g_st=ic",
            coverPhoto: "assets/images/cover/hitam-5-1.webp",
        },
        livestream: {
            date: "Minggu, 29 Desember 2024",
            time: "12.00 WIB - Selesai",
            platformLabel: "Instagram",
            url: "https://www.instagram.com/wekita.id/",
        },
    },
    copy: {
        openingGreeting: "The Wedding Of",
        openingText:
            "Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i serta kerabat sekalian untuk menghadiri acara pernikahan kami:",
        quote:
            "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
        quoteSource: "QS Ar-Rum 21",
        giftTitle: "Wedding Gift",
        giftIntro:
            "Doa restu Anda merupakan karunia yang sangat berarti bagi kami, dan jika memberi adalah ungkapan tanda kasih, Anda dapat memberi kado secara cashless.",
        closingText:
            "Merupakan suatu kehormatan dan kebahagiaan bagi kami, apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Atas kehadiran dan doa restunya, kami mengucapkan terima kasih.",
        closingLabel: "Kami yang berbahagia,",
        closingBackgroundPhoto: "assets/images/cover/akhir-ed-1.webp",
    },
    lovestory: [
        {
            title: "Awal Cerita",
            date: "06 Desember 2022",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
            photo: "",
        },
        {
            title: "Komitmen",
            date: "08 Desember 2022",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
            photo: "",
        },
        {
            title: "Hari Bahagia",
            date: "10 Desember 2022",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
            photo: "",
        },
    ],
    gallery: [
        "assets/images/gallery/gallery-01.jpg",
        "assets/images/gallery/gallery-02.jpg",
        "assets/images/gallery/gallery-03.jpg",
        "assets/images/gallery/gallery-04.jpg",
        "assets/images/gallery/gallery-05.jpg",
        "assets/images/gallery/gallery-06.jpg",
        "assets/images/gallery/gallery-07.jpg",
        "assets/images/gallery/gallery-08.jpg",
        "assets/images/gallery/gallery-10.jpg",
    ],
    wishes: [
        {
            author: "Ayu",
            comment: "Selamat menempuh hidup baru. Samawa selalu ya.",
            konfirmasi: "Hadir",
            time: "Baru saja",
        },
        {
            author: "Rizky",
            comment: "Doa terbaik untuk kedua mempelai. Bahagia selalu.",
            konfirmasi: "Hadir",
            time: "2 menit lalu",
        },
        {
            author: "Nina",
            comment: "Masya Allah, semoga dilancarkan sampai hari H.",
            konfirmasi: "Tidak hadir",
            time: "5 menit lalu",
        },
        {
            author: "Dimas",
            comment: "Semoga jadi keluarga yang sakinah, mawaddah, warahmah.",
            konfirmasi: "Hadir",
            time: "8 menit lalu",
        },
        {
            author: "Tamu Undangan",
            comment: "Turut berbahagia. Semoga selalu diberkahi.",
            konfirmasi: "Tidak hadir",
            time: "12 menit lalu",
        },
    ],
    features: {
        countdownEnabled: true,
        saveTheDateEnabled: true,
        digitalEnvelopeEnabled: true,
        digitalEnvelopeInfo: {
            bankList: [
                { bank: "BCA", account: "1234567890", name: "Habib" },
                { bank: "DANA", account: "1234567890", name: "Habib" },
            ],
            shipping: {
                recipient: "Habib Yulianto",
                phone: "0896343433",
                address: "Ds Pagu Kec.Wates Kab. Kediri",
            },
        },
        rsvpEnabled: true,
        livestreamEnabled: false,
    },
    gift: {
        bankList: [
            { bank: "BCA", account: "1234567890", name: "Habib" },
            { bank: "DANA", account: "1234567890", name: "Habib" },
        ],
        shipping: {
            recipient: "Habib Yulianto",
            phone: "0896343433",
            address: "Ds Pagu Kec.Wates Kab. Kediri",
        },
    },
    audio: {
        src: "assets/audio/Percy-Faith-His-Orchestra-A-Summer-Place-1959__Wd3dlEvodk-1.mp3",
    },
};
