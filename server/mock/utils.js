import { getPackageConfig, normalizePackageTier } from "../../src/data/packageCatalog.js";
import { findThemeBySlug } from "./data/themes.seed.js";

const PUBLIC_INVITATION_STATUSES = new Set(["published", "done"]);

export function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

export function buildOrderId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `IKC-${yy}${mm}${dd}-${random}`;
}

export function buildInvitationSchemaFromTheme(slug) {
  const theme = findThemeBySlug(slug);
  const packageConfig = getPackageConfig(theme?.packageTier);
  const coupleParts = (theme?.couple || "Habib & Adiba").split("&").map((part) => part.trim());
  const groomName = coupleParts[0] || "Habib";
  const brideName = coupleParts[1] || "Adiba";
  const heroPhoto = theme?.thumbnail || theme?.image || "";
  const status = "published";
  const isPublished = PUBLIC_INVITATION_STATUSES.has(status);
  const publishedAt = new Date().toISOString();

  return {
    status,
    orderStatus: status,
    isPublished,
    publishedAt,
    completedAt: null,
    invitation: {
      slug,
      orderId: null,
      status,
      isPublished,
      publishedAt,
      completedAt: null,
    },
    guest: {
      name: "Nama Tamu",
      greetingLabel: "Kepada Bapak/Ibu/Saudara/i",
      code: "",
    },
    couple: {
      groom: {
        nameFull: `${groomName} Yulianto`,
        nickName: groomName,
        instagram: "ikatancinta.in",
        photo: heroPhoto,
        parentInfo: "Putra dari Bapak Putra & Ibu Putri",
      },
      bride: {
        nameFull: `${brideName} Putri`,
        nickName: brideName,
        instagram: "ikatancinta.in",
        photo: heroPhoto,
        parentInfo: "Putri dari Bapak Putra & Ibu Putri",
      },
      heroPhoto,
    },
    event: {
      dateISO: "2026-03-30T10:00:00+07:00",
      akad: {
        date: "Senin, 30 Maret 2026",
        time: "09.00 - 10.00 WIB",
        address: "Simpang Lima Gumul, Kediri",
        mapsUrl: "https://maps.google.com",
      },
      resepsi: {
        date: "Senin, 30 Maret 2026",
        time: "11.00 - 14.00 WIB",
        address: "Simpang Lima Gumul, Kediri",
        mapsUrl: "https://maps.google.com",
      },
      livestream: {
        date: "Senin, 30 Maret 2026",
        time: "10.00 WIB",
        platformLabel: "YouTube",
        url: "https://youtube.com",
      },
    },
    copy: {
      openingGreeting: theme?.title || "The Wedding Of",
      openingText: "Tanpa mengurangi rasa hormat, kami mengundang Anda untuk menghadiri acara pernikahan kami.",
      quote: "",
      quoteSource: "",
      closingText: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.",
    },
    lovestory: packageConfig.capabilities.loveStory
      ? [
        { title: "Pertama Bertemu", text: "Kami pertama kali bertemu dalam sebuah acara kampus.", date: "2019", photo: heroPhoto },
        { title: "Menjalin Asmara", text: "Hubungan kami tumbuh menjadi komitmen yang lebih serius.", date: "2021", photo: heroPhoto },
      ]
      : [],
    gallery: Array.from({ length: Math.min(packageConfig.limits.galleryMax, 4) }, () => heroPhoto).filter(Boolean),
    features: {
      countdownEnabled: true,
      saveTheDateEnabled: true,
      digitalEnvelopeEnabled: packageConfig.capabilities.digitalEnvelope,
      digitalEnvelopeInfo: {
        bankList: packageConfig.capabilities.digitalEnvelope
          ? [{ bank: "BCA", accountNumber: "1234567890", accountName: "Ikatan Cinta" }]
          : [],
      },
      rsvpEnabled: packageConfig.capabilities.rsvp,
      livestreamEnabled: packageConfig.capabilities.livestream,
    },
    audio: {
      src: "",
      autoplay: false,
      loop: true,
    },
    wishes: {
      title: "Ucapan",
      initial: [
        {
          author: "Tim Ikatan Cinta",
          comment: "Semoga acara berjalan lancar dan penuh kebahagiaan.",
          attendance: "hadir",
          createdAt: "2026-03-12T10:00:00.000Z",
        },
      ],
    },
  };
}

function sanitizeAssetReference(asset, fallbackKind = "file") {
  if (!asset || typeof asset !== "object") {
    return null;
  }

  const assetId = typeof asset.assetId === "string" ? asset.assetId : "";
  const url = typeof asset.url === "string" ? asset.url : "";
  if (!assetId && !url) {
    return null;
  }

  return {
    assetId: assetId || null,
    kind: typeof asset.kind === "string" ? asset.kind : fallbackKind,
    name: typeof asset.name === "string" ? asset.name : "asset",
    mimeType: typeof asset.mimeType === "string" ? asset.mimeType : "application/octet-stream",
    size: Number.isFinite(asset.size) ? asset.size : asset.size ? Number(asset.size) : null,
    url: url || null,
  };
}

function normalizeMusicPayload(music, packageConfig) {
  if (!music || typeof music !== "object") {
    return null;
  }

  if (music.mode === "upload") {
    if (!packageConfig.capabilities.customMusic) {
      return {
        mode: "list",
        trackId: "andmesh-cinta-luar-biasa",
        trackLabel: "Andmesh - Cinta Luar Biasa",
      };
    }

    return {
      mode: "upload",
      file: sanitizeAssetReference(music.file, "music"),
    };
  }

  return {
    mode: "list",
    trackId: music.trackId || "andmesh-cinta-luar-biasa",
    trackLabel: music.trackLabel || "Andmesh - Cinta Luar Biasa",
    previewUrl: music.previewUrl || null,
  };
}

export function sanitizeOrderPayload(payload) {
  const selectedTheme = payload?.selectedTheme || {};
  const selectedPackage = payload?.selectedPackage || {};
  const packageTier = normalizePackageTier(selectedPackage.tier || selectedTheme.packageTier);
  const packageConfig = getPackageConfig(packageTier);
  const theme = findThemeBySlug(selectedTheme.slug);

  if (!theme) {
    return { error: "THEME_NOT_FOUND" };
  }

  if (normalizePackageTier(theme.packageTier) !== packageConfig.tier) {
    return { error: "THEME_PACKAGE_MISMATCH" };
  }

  const galleryImages = Array.isArray(payload?.galleryImages)
    ? payload.galleryImages
      .map((image) => sanitizeAssetReference(image, "gallery"))
      .filter(Boolean)
      .slice(0, packageConfig.limits.galleryMax)
    : [];

  const stories = packageConfig.capabilities.loveStory
    ? Array.isArray(payload?.stories) ? payload.stories : []
    : [];

  const music = normalizeMusicPayload(payload?.music, packageConfig);

  return {
    value: {
      ...payload,
      coverImage: sanitizeAssetReference(payload?.coverImage, "cover"),
      galleryImages,
      stories,
      music,
      selectedTheme: {
        ...selectedTheme,
        packageTier: packageConfig.tier,
        name: theme.name,
        presetId: theme.presetId,
      },
      selectedPackage: packageConfig,
    },
  };
}

export function deriveOrderProgress(order) {
  return {
    status: order?.status || "processing",
    completedAt: order?.completedAt || null,
  };
}

export function serializeOrder(order) {
  const progress = deriveOrderProgress(order);

  return {
    id: order.id,
    orderId: order.id,
    createdAt: order.createdAt,
    completedAt: progress.completedAt,
    status: progress.status,
    customerName: order.payload?.customer?.name || null,
    packageTier: order.payload?.selectedPackage?.tier || null,
    themeSlug: order.payload?.selectedTheme?.slug || null,
    themeName: order.payload?.selectedTheme?.name || null,
    totalPrice: order.payload?.selectedPackage?.price || null,
    payload: order.payload,
  };
}
