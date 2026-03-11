import schemaJson from "./schema.json";

export const defaultSchema = {
  slug: "puspa-asmara",
  guest: {
    name: schemaJson.guest?.name || "Nama Tamu",
  },
  groom: {
    ...(schemaJson.groom || {}),
  },
  bride: {
    ...(schemaJson.bride || {}),
  },
  event: {
    ...(schemaJson.event || {}),
    akad: {
      ...(schemaJson.event?.akad || {}),
    },
    resepsi: {
      ...(schemaJson.event?.resepsi || {}),
    },
  },
  streaming: {
    ...(schemaJson.streaming || {}),
  },
  gallery: Array.isArray(schemaJson.gallery) ? [...schemaJson.gallery] : [],
  gifts: {
    ...(schemaJson.gifts || {}),
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
  media: {
    ...(schemaJson.media || {}),
  },
  features: {
    ...(schemaJson.features || {}),
    audioEnabled: schemaJson.features?.audioEnabled ?? true,
    lottieEnabled: schemaJson.features?.lottieEnabled ?? true,
    lightboxEnabled: schemaJson.features?.lightboxEnabled ?? true,
    wishesEnabled: schemaJson.features?.wishesEnabled ?? true,
    digitalEnvelopeEnabled: schemaJson.features?.digitalEnvelopeEnabled ?? true,
  },
  couple: {
    groom: {
      nickName: schemaJson.groom?.nickName || "Habib",
      nameFull: schemaJson.groom?.fullName || "Habib Yulianto",
      parentInfo: schemaJson.groom?.parentInfo || "Putra Ketiga dari Bapak Putra & Ibu Putri",
      instagram: schemaJson.groom?.instagram || "https://www.instagram.com/",
    },
    bride: {
      nickName: schemaJson.bride?.nickName || "Adiba",
      nameFull: schemaJson.bride?.fullName || "Adiba Putri Syakila",
      parentInfo: schemaJson.bride?.parentInfo || "Putri Ketiga dari Bapak Putra & Ibu Putri",
      instagram: schemaJson.bride?.instagram || "https://www.instagram.com/",
    },
  },
};

export default defaultSchema;
