import { getPackageConfig, normalizePackageTier } from "../../src/data/packageCatalog.js";
import { findThemeBySlug } from "./data/themes.seed.js";

const PUBLIC_INVITATION_STATUSES = new Set(["published", "done"]);

function normalizeText(value) {
  return String(value || "").trim();
}

function inferLivestreamPlatformLabel(url, fallback = "") {
  const raw = normalizeText(url).toLowerCase();
  if (!raw) return normalizeText(fallback);
  if (raw.includes("youtube.com") || raw.includes("youtu.be")) return "YouTube";
  if (raw.includes("instagram.com")) return "Instagram";
  if (raw.includes("zoom.us")) return "Zoom";
  if (raw.includes("tiktok.com")) return "TikTok";
  return normalizeText(fallback) || "Live Streaming";
}

function formatEventTimeRange(startTime, endTime) {
  const start = normalizeText(startTime);
  const end = normalizeText(endTime);
  if (!start) return "";
  const normalizedStart = start.replace(":", ".");
  if (!end) return `${normalizedStart} WIB`;
  return `${normalizedStart} - ${end.replace(":", ".")} WIB`;
}

function normalizeAssetPayload(asset, fallbackKind = "file") {
  if (!asset) return null;

  if (typeof asset === "string") {
    return {
      assetId: null,
      kind: fallbackKind,
      name: "asset",
      mimeType: "",
      size: null,
      url: asset,
    };
  }

  if (typeof asset !== "object") return null;
  const assetId = typeof asset.assetId === "string" ? asset.assetId : null;
  const url = typeof asset.url === "string" ? asset.url : null;
  if (!assetId && !url) return null;

  return {
    assetId,
    kind: typeof asset.kind === "string" ? asset.kind : fallbackKind,
    name: typeof asset.name === "string" ? asset.name : "asset",
    mimeType: typeof asset.mimeType === "string" ? asset.mimeType : "",
    size: Number.isFinite(asset.size) ? asset.size : asset.size ? Number(asset.size) : null,
    url,
  };
}

function normalizeStoryPayload(story, fallbackPhoto) {
  if (!story || typeof story !== "object") return null;
  const photo = normalizeAssetPayload(story?.photo, "love-story") || normalizeAssetPayload(fallbackPhoto, "love-story");
  return {
    title: story?.title || "",
    description: story?.description || story?.text || story?.story || "",
    text: story?.text || story?.description || story?.story || "",
    date: story?.date || "",
    photo,
  };
}

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

export function buildInvitationSchemaFromTheme(slug, order = null) {
  const theme = findThemeBySlug(slug);
  const packageConfig = getPackageConfig(theme?.packageTier);
  const coupleParts = (theme?.couple || "Habib & Adiba").split("&").map((part) => part.trim());
  const groomName = coupleParts[0] || "Habib";
  const brideName = coupleParts[1] || "Adiba";
  const payload = order?.payload || {};
  const frontCoverPhoto = payload?.frontCoverImage?.url || payload?.coverImage?.url || theme?.thumbnail || theme?.image || "";
  const heroPhoto = payload?.coverImage?.url || theme?.thumbnail || theme?.image || "";
  const bridePhoto = payload?.bride?.photo?.url || heroPhoto;
  const groomPhoto = payload?.groom?.photo?.url || heroPhoto;
  const loveStories = Array.isArray(payload?.stories)
    ? payload.stories
        .map((story) => ({
          title: story?.title || "",
          text: story?.description || "",
          date: story?.date || "",
          photo: story?.photo?.url || heroPhoto,
        }))
        .filter((story) => story.title || story.text || story.date)
    : [];
  const rawStories = Array.isArray(payload?.stories)
    ? payload.stories.map((story) => normalizeStoryPayload(story, heroPhoto)).filter(Boolean)
    : [];
  const rawGalleryImages = Array.isArray(payload?.galleryImages)
    ? payload.galleryImages.map((image) => normalizeAssetPayload(image, "gallery")).filter(Boolean)
    : [];
  const rawLivestream = payload?.livestream || payload?.event?.livestream || {};
  const livestreamUrl = normalizeText(rawLivestream?.url || rawLivestream?.link);
  const livestreamEnabled = Boolean(payload?.features?.livestreamEnabled || rawLivestream?.enabled || livestreamUrl);
  const livestreamPlatformLabel = inferLivestreamPlatformLabel(livestreamUrl, rawLivestream?.platformLabel || rawLivestream?.label);
  const livestreamDate = normalizeText(rawLivestream?.date || payload?.akad?.date);
  const livestreamTime = normalizeText(rawLivestream?.time || formatEventTimeRange(payload?.akad?.startTime, payload?.akad?.endTime));
  const status = "published";
  const isPublished = PUBLIC_INVITATION_STATUSES.has(status);
  const publishedAt = new Date().toISOString();

  return {
    status,
    orderStatus: status,
    orderId: order?.id || null,
    invitationSlug: slug,
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
    customer: payload?.customer || null,
    theme: {
      slug: theme?.slug || "",
      name: theme?.name || "",
      title: theme?.title || "",
      packageTier: packageConfig?.tier || theme?.packageTier || "",
    },
    selectedTheme: payload?.selectedTheme || {
      slug: theme?.slug || "",
      name: theme?.name || "",
      packageTier: packageConfig?.tier || theme?.packageTier || "",
    },
    selectedPackage: payload?.selectedPackage || packageConfig,
    groom: {
      fullname: payload?.groom?.fullname || `${groomName} Yulianto`,
      nickname: payload?.groom?.nickname || groomName,
      instagram: payload?.groom?.instagram || "ikatancinta.in",
      parents: payload?.groom?.parents || "Putra dari Bapak Putra & Ibu Putri",
      photo: normalizeAssetPayload(payload?.groom?.photo, "groom") || normalizeAssetPayload(groomPhoto, "groom"),
    },
    bride: {
      fullname: payload?.bride?.fullname || `${brideName} Putri`,
      nickname: payload?.bride?.nickname || brideName,
      instagram: payload?.bride?.instagram || "ikatancinta.in",
      parents: payload?.bride?.parents || "Putri dari Bapak Putra & Ibu Putri",
      photo: normalizeAssetPayload(payload?.bride?.photo, "bride") || normalizeAssetPayload(bridePhoto, "bride"),
    },
    couple: {
      groom: {
        nameFull: `${groomName} Yulianto`,
        nickName: groomName,
        instagram: "ikatancinta.in",
        photo: groomPhoto,
        parentInfo: "Putra dari Bapak Putra & Ibu Putri",
      },
      bride: {
        nameFull: `${brideName} Putri`,
        nickName: brideName,
        instagram: "ikatancinta.in",
        photo: bridePhoto,
        parentInfo: "Putri dari Bapak Putra & Ibu Putri",
      },
      frontCoverPhoto,
      heroPhoto,
    },
    frontCoverImage: normalizeAssetPayload(payload?.frontCoverImage, "front-cover") || normalizeAssetPayload(frontCoverPhoto, "front-cover"),
    coverImage: normalizeAssetPayload(payload?.coverImage, "cover") || normalizeAssetPayload(heroPhoto, "cover"),
    event: {
      dateISO: "2026-03-30T10:00:00+07:00",
      akad: {
        date: "Senin, 30 Maret 2026",
        time: "09.00 - 10.00 WIB",
        venueName: payload?.akad?.venue || "",
        address: "Simpang Lima Gumul, Kediri",
        mapsUrl: "https://maps.google.com",
      },
      resepsi: {
        date: "Senin, 30 Maret 2026",
        time: "11.00 - 14.00 WIB",
        venueName: payload?.resepsi?.venue || "",
        address: "Simpang Lima Gumul, Kediri",
        mapsUrl: "https://maps.google.com",
      },
      livestream: {
        date: livestreamDate,
        time: livestreamTime,
        platformLabel: livestreamPlatformLabel,
        url: livestreamUrl,
      },
    },
    akad: {
      date: payload?.akad?.date || "",
      startTime: payload?.akad?.startTime || "",
      endTime: payload?.akad?.endTime || "",
      time: payload?.akad?.startTime ? `${String(payload.akad.startTime).replace(":", ".")} - ${String(payload?.akad?.endTime || "10:00").replace(":", ".")} WIB` : "",
      venue: payload?.akad?.venue || "",
      address: payload?.akad?.address || "Simpang Lima Gumul, Kediri",
      mapsLink: payload?.akad?.mapsLink || "https://maps.google.com",
      coverImage: normalizeAssetPayload(payload?.akad?.coverImage, "akad-cover"),
    },
    resepsi: {
      date: payload?.resepsi?.date || "",
      startTime: payload?.resepsi?.startTime || "",
      endTime: payload?.resepsi?.endTime || "",
      time: payload?.resepsi?.startTime ? `${String(payload.resepsi.startTime).replace(":", ".")} - ${String(payload?.resepsi?.endTime || "10:00").replace(":", ".")} WIB` : "",
      venue: payload?.resepsi?.venue || "",
      address: payload?.resepsi?.address || "Simpang Lima Gumul, Kediri",
      mapsLink: payload?.resepsi?.mapsLink || "https://maps.google.com",
      coverImage: normalizeAssetPayload(payload?.resepsi?.coverImage, "resepsi-cover"),
    },
    copy: {
      openingGreeting: "The Wedding Of",
      openingText: "Tanpa mengurangi rasa hormat, kami mengundang Anda untuk menghadiri acara pernikahan kami.",
      quote: "",
      quoteSource: "",
      closingText: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.",
    },
    quote: payload?.quote || "",
    quoteSource: payload?.quoteSource || "",
    closingBackgroundImage: normalizeAssetPayload(payload?.closingBackgroundImage, "closing-bg"),
    lovestory: packageConfig.capabilities.loveStory
      ? (loveStories.length > 0
        ? loveStories
        : [
          { title: "Pertama Bertemu", text: "Kami pertama kali bertemu dalam sebuah acara kampus.", date: "2019", photo: heroPhoto },
          { title: "Menjalin Asmara", text: "Hubungan kami tumbuh menjadi komitmen yang lebih serius.", date: "2021", photo: heroPhoto },
        ])
      : [],
    stories: packageConfig.capabilities.loveStory ? rawStories : [],
    gallery: Array.from({ length: Math.min(packageConfig.limits.galleryMax, 4) }, () => heroPhoto).filter(Boolean),
    galleryImages: rawGalleryImages,
    livestream: {
      enabled: livestreamEnabled,
      url: livestreamUrl,
      platformLabel: livestreamPlatformLabel,
      date: livestreamDate,
      time: livestreamTime,
    },
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
      livestreamEnabled: livestreamEnabled,
    },
    gift: {
      bankList: Array.isArray(payload?.gift?.bankList) ? payload.gift.bankList : [],
      shipping: payload?.gift?.shipping || {},
    },
    music: payload?.music || null,
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
    ? Array.isArray(payload?.stories)
      ? payload.stories.map((story) => ({
          ...story,
          photo: sanitizeAssetReference(story?.photo, "love-story"),
        }))
      : []
    : [];

  const music = normalizeMusicPayload(payload?.music, packageConfig);
  const normalizedLivestreamUrl = normalizeText(payload?.livestream?.url || payload?.livestream?.link);
  const livestream = {
    enabled: Boolean(payload?.livestream?.enabled || normalizedLivestreamUrl),
    url: normalizedLivestreamUrl,
    platformLabel: inferLivestreamPlatformLabel(normalizedLivestreamUrl, payload?.livestream?.platformLabel || payload?.livestream?.label),
  };
  const features = {
    ...(payload?.features || {}),
    livestreamEnabled: Boolean(payload?.features?.livestreamEnabled || livestream.enabled || livestream.url),
  };

  return {
    value: {
      ...payload,
      coverImage: sanitizeAssetReference(payload?.coverImage, "cover"),
      galleryImages,
      stories,
      livestream,
      features,
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
