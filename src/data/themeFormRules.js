import { normalizePackageTier } from "./packageCatalog";

const BASE_UPLOAD_FIELDS = {
  frontCover: {
    visible: true,
    required: true,
    description: "Dipakai khusus untuk background cover depan sebelum tamu menekan tombol buka undangan.",
  },
  cover: {
    visible: true,
    required: true,
    description: "Dipakai untuk hero foto di bagian dalam setelah undangan dibuka. Format JPG/PNG, Max 5MB, gunakan orientasi landscape.",
  },
  openingThumbnail: {
    visible: false,
    required: false,
    description: "Dipakai untuk thumbnail pasangan pada section pertama setelah undangan dibuka.",
  },
  bridePhoto: {
    visible: true,
    required: false,
    description: "Dipakai pada section profil wanita. Jika kosong, sistem pakai cover utama.",
  },
  groomPhoto: {
    visible: true,
    required: false,
    description: "Dipakai pada section profil pria. Jika kosong, sistem pakai cover utama.",
  },
  akadCover: {
    visible: false,
    required: false,
    description: "Dipakai pada section wedding event akad.",
  },
  resepsiCover: {
    visible: false,
    required: false,
    description: "Dipakai pada section wedding event resepsi.",
  },
  closingBackground: {
    visible: true,
    required: false,
    description: "Dipakai sebagai background section penutup atau ucapan terima kasih.",
  },
  loveStoryPhotoOne: {
    visible: false,
    required: false,
    description: "Dipakai sebagai thumbnail foto untuk momen love story pertama.",
  },
  loveStoryPhotoTwo: {
    visible: false,
    required: false,
    description: "Dipakai sebagai thumbnail foto untuk momen love story kedua.",
  },
  saveTheDateBackground: {
    visible: false,
    required: false,
    description: "Dipakai sebagai background section save the date.",
  },
  wishesBackground: {
    visible: false,
    required: false,
    description: "Dipakai sebagai background section wishes atau ucapan.",
  },
};

const TIER_UPLOAD_OVERRIDES = {
  BASIC: {
    akadCover: { visible: true },
    resepsiCover: { visible: true },
  },
  PREMIUM: {},
  EKSKLUSIF: {},
};

const THEME_UPLOAD_OVERRIDES = {
  "ivory-grace": {
    frontCover: {
      description: "Dipakai khusus untuk background cover depan sebelum tamu menekan tombol buka undangan. Saran ukuran ideal portrait 9:16.",
    },
    cover: {
      description: "Dipakai untuk hero foto di bagian dalam setelah undangan dibuka. Format JPG/PNG, Max 5MB. Saran ukuran ideal portrait 9:16.",
    },
    bridePhoto: {
      description: "Dipakai pada section profil wanita. Jika kosong, sistem pakai cover utama. Saran ukuran ideal 410x325 px.",
    },
    groomPhoto: {
      description: "Dipakai pada section profil pria. Jika kosong, sistem pakai cover utama. Saran ukuran ideal 410x325 px.",
    },
    akadCover: {
      description: "Dipakai pada section wedding event akad. Saran ukuran ideal 410x225 px.",
    },
    resepsiCover: {
      description: "Dipakai pada section wedding event resepsi. Saran ukuran ideal 410x225 px.",
    },
    closingBackground: {
      description: "Dipakai sebagai background section penutup atau ucapan terima kasih. Saran ukuran ideal 1:1.",
    },
  },
  "noir-minimalist": {
    frontCover: {
      description: "Dipakai khusus untuk background cover depan sebelum tamu menekan tombol buka undangan. Saran ukuran ideal portrait 9:16.",
    },
    bridePhoto: {
      description: "Dipakai pada section profil wanita. Jika kosong, sistem pakai cover utama. Saran ukuran ideal 295x355 px.",
    },
    groomPhoto: {
      description: "Dipakai pada section profil pria. Jika kosong, sistem pakai cover utama. Saran ukuran ideal 295x355 px.",
    },
    akadCover: {
      description: "Dipakai pada section wedding event akad. Saran ukuran ideal 410x225 px.",
    },
    resepsiCover: {
      description: "Dipakai pada section wedding event resepsi. Saran ukuran ideal 410x225 px.",
    },
    closingBackground: {
      description: "Dipakai sebagai background section penutup atau ucapan terima kasih. Saran ukuran ideal 1:1.",
    },
  },
  "navy-blossom": {
    closingBackground: {
      description: "Dipakai sebagai background section penutup atau ucapan terima kasih. Untuk Navy Blossom, ukuran ideal 400x220 px.",
    },
    saveTheDateBackground: {
      visible: true,
      description: "Khusus template Navy Blossom. Jika kosong, akan mengikuti foto setelah buka undangan. Ukuran ideal 430x220 px.",
    },
    wishesBackground: {
      visible: true,
      description: "Khusus template Navy Blossom. Jika kosong, akan mengikuti foto setelah buka undangan. Ukuran ideal 450x200 px.",
    },
  },
  "velvet-burgundy": {
    frontCover: {
      visible: true,
      required: true,
      description: "Dipakai khusus untuk cover utama sebelum tamu menekan tombol buka undangan pada Velvet Burgundy.",
    },
    cover: {
      visible: false,
      required: false,
      description: "Tidak digunakan di template Velvet Burgundy.",
    },
    akadCover: {
      visible: true,
      description: "Dipakai sebagai background foto section akad pada Velvet Burgundy. Jika kosong, akan mengikuti cover utama. Saran ukuran ideal portrait 4:5 atau landscape yang fokus ke subjek.",
    },
    resepsiCover: {
      visible: true,
      description: "Dipakai sebagai background foto section resepsi pada Velvet Burgundy. Jika kosong, akan mengikuti cover utama atau foto akad. Saran ukuran ideal portrait 4:5 atau landscape yang fokus ke subjek.",
    },
  },
  "misty-romance": {
    frontCover: {
      description: "Dipakai khusus untuk background cover depan sebelum tamu menekan tombol buka undangan pada Misty Romance.",
    },
    cover: {
      visible: true,
      required: true,
      description: "Dipakai untuk foto thumbnail pasangan setelah undangan dibuka pada Misty Romance.",
    },
    bridePhoto: {
      description: "Dipakai pada section profil wanita. Jika kosong, sistem pakai foto bawaan template Misty Romance.",
    },
    groomPhoto: {
      description: "Dipakai pada section profil pria. Jika kosong, sistem pakai foto bawaan template Misty Romance.",
    },
    akadCover: {
      visible: false,
      required: false,
      description: "Tidak digunakan di template Misty Romance.",
    },
    resepsiCover: {
      visible: false,
      required: false,
      description: "Tidak digunakan di template Misty Romance.",
    },
    loveStoryPhotoOne: {
      visible: true,
      description: "Dipakai sebagai thumbnail foto untuk momen love story pertama pada Misty Romance.",
    },
    loveStoryPhotoTwo: {
      visible: true,
      description: "Dipakai sebagai thumbnail foto untuk momen love story kedua pada Misty Romance.",
    },
    closingBackground: {
      visible: true,
      required: false,
      description: "Dipakai sebagai background section penutup pada Misty Romance.",
    },
  },
  "puspa-asmara": {
    frontCover: {
      visible: false,
      required: false,
      description: "Tidak digunakan di form order Puspa Asmara karena cover depan memakai asset bawaan template.",
    },
    cover: {
      visible: true,
      required: true,
      description: "Dipakai untuk cover dalam setelah undangan dibuka pada media desktop di Puspa Asmara.",
    },
    openingThumbnail: {
      visible: true,
      required: true,
      description: "Dipakai untuk thumbnail pasangan pada section pertama setelah undangan dibuka di Puspa Asmara.",
    },
    akadCover: {
      visible: true,
      description: "Dipakai sebagai background foto section akad pada Puspa Asmara. Jika kosong, sistem pakai cover utama.",
    },
    resepsiCover: {
      visible: true,
      description: "Dipakai sebagai background foto section resepsi pada Puspa Asmara. Jika kosong, sistem pakai foto akad atau cover utama.",
    },
    closingBackground: {
      visible: true,
      required: false,
      description: "Dipakai sebagai foto penutup pada section akhir Puspa Asmara.",
    },
  },
  "botanical-elegance": {
    frontCover: {
      visible: true,
      required: true,
      title: "Foto Thumbnail Pasangan",
      reviewLabel: "Thumbnail Pasangan Cover Depan",
      uploadLabel: "Upload atau Drop Foto",
      validationMessage: "Mohon upload foto thumbnail pasangan terlebih dahulu.",
      description: "Dipakai sebagai foto thumbnail pasangan pada cover utama sebelum tamu menekan tombol buka undangan di Botanical Elegance.",
    },
    cover: {
      visible: true,
      required: true,
      title: "Foto Side Cover Desktop",
      reviewLabel: "Side Cover Desktop",
      sectionTitle: "Cover Desktop",
      validationMessage: "Mohon upload foto side cover desktop terlebih dahulu.",
      description: "Dipakai khusus untuk side cover di sisi kiri pada tampilan desktop atau laptop di Botanical Elegance. Bagian ini bisa dianggap sebagai cover utama desktop.",
    },
    openingThumbnail: {
      visible: false,
      required: false,
      description: "Tidak digunakan di template Botanical Elegance karena foto pasangan ditampilkan di cover utama sebelum undangan dibuka.",
    },
    akadCover: {
      visible: false,
      required: false,
      description: "Tidak digunakan di template Botanical Elegance karena section akad tidak memakai background foto terpisah.",
    },
    resepsiCover: {
      visible: false,
      required: false,
      description: "Tidak digunakan di template Botanical Elegance karena section resepsi tidak memakai background foto terpisah.",
    },
    loveStoryPhotoOne: {
      visible: false,
      required: false,
      description: "Tidak digunakan di template Botanical Elegance karena section love story tidak memiliki thumbnail foto.",
    },
    loveStoryPhotoTwo: {
      visible: false,
      required: false,
      description: "Tidak digunakan di template Botanical Elegance karena section love story tidak memiliki thumbnail foto.",
    },
  },
};

export function getThemeUploadConfig(theme, packageConfig) {
  const tier = normalizePackageTier(packageConfig?.tier || theme?.packageTier || "BASIC");
  const tierOverrides = TIER_UPLOAD_OVERRIDES[tier] || {};
  const themeOverrides = THEME_UPLOAD_OVERRIDES[theme?.slug] || {};

  return Object.fromEntries(
    Object.entries(BASE_UPLOAD_FIELDS).map(([slotKey, baseConfig]) => {
      const mergedConfig = {
        ...baseConfig,
        ...(tierOverrides[slotKey] || {}),
        ...(themeOverrides[slotKey] || {}),
      };

      return [
        slotKey,
        {
          ...mergedConfig,
          required: Boolean(mergedConfig.visible),
        },
      ];
    }),
  );
}
