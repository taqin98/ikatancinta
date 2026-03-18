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
};

export function getThemeUploadConfig(theme, packageConfig) {
  const tier = normalizePackageTier(packageConfig?.tier || theme?.packageTier || "BASIC");
  const tierOverrides = TIER_UPLOAD_OVERRIDES[tier] || {};
  const themeOverrides = THEME_UPLOAD_OVERRIDES[theme?.slug] || {};

  return Object.fromEntries(
    Object.entries(BASE_UPLOAD_FIELDS).map(([slotKey, baseConfig]) => [
      slotKey,
      {
        ...baseConfig,
        ...(tierOverrides[slotKey] || {}),
        ...(themeOverrides[slotKey] || {}),
      },
    ]),
  );
}
