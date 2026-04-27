const PACKAGE_TIER_ALIASES = {
  EKSLUSIF: "EKSKLUSIF",
};

const PACKAGE_CATALOG = {
  BASIC: {
    tier: "BASIC",
    name: "BASIC",
    description: "Untuk kamu yang hanya ingin menyebarkan informasi undangan secara sederhana.",
    oldPrice: 110000,
    price: 59000,
    discount: "46% OFF",
    cta: "Pilih BASIC",
    highlighted: false,
    features: [
      "Preset/Desain standar",
      "Link undangan dengan nama tamu",
      "Cover undangan",
      "Nama pasangan & nama tamu",
      "Ayat / quote dinamis",
      "Foto & Profil pasangan",
      "Cover akad & resepsi, Detail Info Acara",
      "Galeri foto (maks. 4)",
      "Background penutup / ucapan terima kasih",
      "Musik latar (pilihan dari katalog)",
      "Buka lokasi via Google Maps",
      "Tambahkan ke Google Calendar",
      "RSVP (Konfirmasi kehadiran)",
      "Masa aktif jangka panjang",
      "Revisi konten sesuai kebijakan layanan",
    ],
    limits: {
      galleryMax: 4,
      guestShareMax: 60,
    },
    capabilities: {
      customMusic: false,
      loveStory: false,
      digitalEnvelope: false,
      guestBook: false,
      rsvp: true,
      livestream: false,
      customDomain: false,
      guestNameSharing: true,
      multiLanguage: false,
      imageInvitationBonus: false,
      prioritySupport: false,
    },
  },
  PREMIUM: {
    tier: "PREMIUM",
    name: "PREMIUM",
    description:
      "Paket paling populer. Selain informasi undangan, tamu dapat memberikan ucapan, kado digital, dan konfirmasi kehadiran.",
    oldPrice: 250000,
    price: 110000,
    discount: "56% OFF",
    cta: "Pilih PREMIUM",
    highlighted: true,
    features: [
      "Semua fitur paket BASIC",
      "Preset/Desain premium",
      "Amplop digital (nomor rekening)",
      "Galeri foto (maks. 8)",
      "Love stories",
      "Link Live Streaming",
      "Buku Tamu",
      "Background music (list dan custom upload)",
      "Custom domain (opsional, biaya domain tidak termasuk)",
      "Masa aktif jangka panjang",
      "Revisi konten sesuai kebijakan layanan",
    ],
    limits: {
      galleryMax: 8,
      guestShareMax: 150,
    },
    capabilities: {
      customMusic: true,
      loveStory: true,
      digitalEnvelope: true,
      guestBook: true,
      rsvp: true,
      livestream: true,
      customDomain: true,
      guestNameSharing: true,
      multiLanguage: false,
      imageInvitationBonus: false,
      prioritySupport: false,
    },
  },
  EKSKLUSIF: {
    tier: "EKSKLUSIF",
    name: "EKSKLUSIF",
    description:
      "Undangan dengan fitur lengkap dan jumlah tamu tanpa batas untuk pengalaman yang lebih eksklusif.",
    oldPrice: 400000,
    price: 209000,
    discount: "48% OFF",
    cta: "Pilih EKSKLUSIF",
    highlighted: false,
    features: [
      "Semua fitur paket PREMIUM",
      "Preset/Desain eksklusif",
      "Galeri foto (maks. 14)",
      "Multi Bahasa (Indonesia / Inggris)",
      "Free: Undangan Gambar",
      "Support Prioritas",
      "Custom domain (opsional, biaya domain tidak termasuk)",
      "Masa aktif jangka panjang",
      "Revisi konten sesuai kebijakan layanan",
    ],
    limits: {
      galleryMax: 14,
      guestShareMax: null,
    },
    capabilities: {
      customMusic: true,
      loveStory: true,
      digitalEnvelope: true,
      guestBook: true,
      rsvp: true,
      livestream: true,
      customDomain: true,
      guestNameSharing: true,
      multiLanguage: true,
      imageInvitationBonus: true,
      prioritySupport: true,
    },
  },
};

export const packagePlans = Object.values(PACKAGE_CATALOG);

export function normalizePackageTier(tier) {
  if (!tier) return "BASIC";
  return PACKAGE_TIER_ALIASES[tier] || tier;
}

export function getPackageConfig(tier) {
  const normalizedTier = normalizePackageTier(tier);
  return PACKAGE_CATALOG[normalizedTier] || PACKAGE_CATALOG.BASIC;
}
