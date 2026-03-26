import { useEffect, useState } from "react";
import {
  IvoryGraceTemplate,
  NavyBlossomTemplate,
  NoirMinimalistTemplate,
} from "../templates/basic";
import {
  BlueNatureTemplate,
  MistyRomanceTemplate,
  TimelessPromiseTemplate,
  VelvetBurgundyTemplate,
} from "../templates/premium";
import {
  BotanicalEleganceTemplate,
  EternalSummitTemplate,
  PuspaAsmaraTemplate,
} from "../templates/exclusive";
import { fetchInvitationBySlug } from "../services/invitationApi";
import { getInvitationSlugFromPath, toAppPath } from "../utils/navigation";
import { applyGuestQueryOverrides, readGuestQueryParams } from "../utils/guestParams";

const invitationTemplates = {
  "blue-nature": BlueNatureTemplate,
  "noir-minimalist": NoirMinimalistTemplate,
  "ivory-grace": IvoryGraceTemplate,
  "navy-blossom": NavyBlossomTemplate,
  "timeless-promise": TimelessPromiseTemplate,
  "misty-romance": MistyRomanceTemplate,
  "velvet-burgundy": VelvetBurgundyTemplate,
  "botanical-elegance": BotanicalEleganceTemplate,
  "puspa-asmara": PuspaAsmaraTemplate,
  "eternal-summit": EternalSummitTemplate,
};

const invitationThemeCandidates = [
  { slug: "blue-nature", name: "Blue Nature" },
  { slug: "noir-minimalist", name: "Noir Minimalist" },
  { slug: "ivory-grace", name: "Ivory Grace" },
  { slug: "navy-blossom", name: "Navy Blossom" },
  { slug: "timeless-promise", name: "Timeless Promise" },
  { slug: "misty-romance", name: "Misty Romance" },
  { slug: "velvet-burgundy", name: "Velvet Burgundy" },
  { slug: "botanical-elegance", name: "Botanical Elegance" },
  { slug: "puspa-asmara", name: "Puspa Asmara" },
  { slug: "eternal-summit", name: "Eternal Summit" },
];

const normalizedThemeLookup = Object.fromEntries(
  invitationThemeCandidates.flatMap((theme) => [
    [normalizeThemeKey(theme.slug), theme.slug],
    [normalizeThemeKey(theme.name), theme.slug],
  ]),
);

const ORDER_STATUSES = ["pending", "processing", "published", "done", "cancelled"];
const PUBLICLY_ACCESSIBLE_STATUSES = new Set(["published", "done"]);

function normalizeThemeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function normalizePublicationStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-");
}

function isExplicitFalse(value) {
  return value === false || value === 0 || value === "0" || value === "false" || value === "no";
}

function isExplicitTrue(value) {
  return value === true || value === 1 || value === "1" || value === "true" || value === "yes";
}

function isInvitationPubliclyAccessible(invitationData) {
  if (!invitationData || typeof invitationData !== "object") return false;

  const statusCandidates = [
    invitationData?.status,
    invitationData?.publishStatus,
    invitationData?.invitation?.status,
    invitationData?.invitation?.publishStatus,
    invitationData?.orderStatus,
    invitationData?.order?.status,
  ]
    .map(normalizePublicationStatus)
    .filter(Boolean);

  const knownOrderStatus = statusCandidates.find((status) => ORDER_STATUSES.includes(status));
  if (knownOrderStatus) {
    return PUBLICLY_ACCESSIBLE_STATUSES.has(knownOrderStatus);
  }

  const publishFlags = [
    invitationData?.isPublished,
    invitationData?.published,
    invitationData?.invitation?.isPublished,
    invitationData?.invitation?.published,
  ];

  if (publishFlags.some(isExplicitFalse)) {
    return false;
  }

  if (publishFlags.some(isExplicitTrue)) {
    return true;
  }

  const publishedAtCandidates = [
    invitationData?.publishedAt,
    invitationData?.publishAt,
    invitationData?.invitation?.publishedAt,
    invitationData?.invitation?.publishAt,
  ];

  if (publishedAtCandidates.some((value) => String(value || "").trim())) {
    return true;
  }

  // Inference: if the backend response does not expose publication metadata,
  // keep the existing behavior to avoid blocking valid live invitations.
  return true;
}

function resolveThemeSlug(invitationData, invitationSlug) {
  const directCandidates = [
    invitationData?.theme?.slug,
    invitationData?.invitation?.themeSlug,
    invitationData?.selectedTheme?.slug,
    invitationSlug,
  ];

  for (const candidate of directCandidates) {
    const normalizedCandidate = normalizeThemeKey(candidate);
    if (normalizedCandidate && invitationTemplates[normalizedCandidate]) {
      return normalizedCandidate;
    }
  }

  const labelCandidates = [
    invitationData?.theme?.name,
    invitationData?.copy?.openingGreeting,
    invitationData?.selectedTheme?.name,
  ];

  for (const candidate of labelCandidates) {
    const matchedSlug = normalizedThemeLookup[normalizeThemeKey(candidate)];
    if (matchedSlug) {
      return matchedSlug;
    }
  }

  return null;
}

export default function PublishedInvitationPage() {
  const invitationSlug = getInvitationSlugFromPath();
  const guestQuery = readGuestQueryParams(window.location.search);
  const [invitationData, setInvitationData] = useState(null);
  const [themeSlug, setThemeSlug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadInvitation() {
      setLoading(true);
      setError("");

      if (!invitationSlug) {
        setInvitationData(null);
        setThemeSlug(null);
        setError("Slug undangan tidak valid.");
        setLoading(false);
        return;
      }

      try {
        const nextInvitationData = await fetchInvitationBySlug(invitationSlug);
        if (!active) return;

        const nextResolvedInvitationData = nextInvitationData;

        if (!isInvitationPubliclyAccessible(nextResolvedInvitationData)) {
          setInvitationData(null);
          setThemeSlug(null);
          setError("Undangan ini masih diproses atau belum dipublikasikan.");
          setLoading(false);
          return;
        }

        const nextThemeSlug = resolveThemeSlug(nextResolvedInvitationData, invitationSlug);
        if (!nextThemeSlug) {
          setInvitationData(nextResolvedInvitationData || null);
          setThemeSlug(null);
          setError("Template undangan untuk slug ini belum bisa dipetakan.");
          setLoading(false);
          return;
        }

        setInvitationData(nextResolvedInvitationData || null);
        setThemeSlug(nextThemeSlug);
      } catch (err) {
        if (!active) return;
        setInvitationData(null);
        setThemeSlug(null);
        setError(err?.message || "Gagal memuat undangan.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInvitation();
    return () => {
      active = false;
    };
  }, [invitationSlug]);

  const Template = themeSlug ? invitationTemplates[themeSlug] || null : null;
  const resolvedInvitationData = applyGuestQueryOverrides(invitationData, guestQuery);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f1e8] px-4 py-10 text-[#5f4d2f]">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#e7dccd] bg-white p-8 text-center shadow-soft">
          <h1 className="mb-2 font-serif text-3xl font-bold">Memuat undangan</h1>
          <p className="text-sm text-[#8f7a57]">Menyiapkan halaman undangan customer...</p>
        </div>
      </main>
    );
  }

  if (!Template || error) {
    return (
      <main className="min-h-screen bg-[#f7f1e8] px-4 py-10 text-[#5f4d2f]">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#e7dccd] bg-white p-8 text-center shadow-soft">
          <h1 className="mb-2 font-serif text-3xl font-bold">Undangan belum tersedia</h1>
          <p className="mb-2 text-sm text-[#8f7a57]">{error || "Slug undangan tidak ditemukan."}</p>
          {invitationSlug ? (
            <p className="mb-6 text-xs uppercase tracking-[0.2em] text-[#aa9470]">{invitationSlug}</p>
          ) : null}
          <a
            href={toAppPath("/")}
            className="inline-flex items-center justify-center rounded-full bg-[#8e742f] px-5 py-3 text-sm font-bold text-white"
          >
            Kembali ke Beranda
          </a>
        </div>
      </main>
    );
  }

  return <Template data={resolvedInvitationData} invitationSlug={invitationSlug} />;
}
