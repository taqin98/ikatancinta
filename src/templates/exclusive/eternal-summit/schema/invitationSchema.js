import schemaJson from "./schema.json";

export const defaultSchema = {
  slug: "eternal-summit",
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
  loveStory: Array.isArray(schemaJson.loveStory) ? [...schemaJson.loveStory] : [],
  gifts: {
    ...(schemaJson.gifts || {}),
    bankAccounts: Array.isArray(schemaJson.gifts?.bankAccounts) ? [...schemaJson.gifts.bankAccounts] : [],
    shipping: {
      ...(schemaJson.gifts?.shipping || {}),
    },
  },
  wishes: Array.isArray(schemaJson.wishes) ? [...schemaJson.wishes] : [],
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
};

export default defaultSchema;
