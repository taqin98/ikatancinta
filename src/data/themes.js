import blueNatureThumbnail from "../templates/basic/blue-nature/assets/images/og-image.webp";
import noirMinimalistThumbnail from "../templates/basic/noir-minimalist/assets/images/LUXURY-01-1.webp";
import ivoryGraceThumbnail from "../templates/basic/ivory-grace/assets/images/LUXURY-02-1.webp";
import timelessPromiseThumbnail from "../templates/premium/timeless-promise/assets/image/ornament/tema-08-scaled-1-1.webp";
import mistyRomanceThumbnail from "../templates/premium/misty-romance/assets/images/cover/cover-main.webp";
import velvetBurgundyThumbnail from "../templates/premium/velvet-burgundy/assets/images/local/wp-content__uploads__2024__09__04-1-1.webp";
import botanicalEleganceThumbnail from "../templates/exclusive/botanical-elegance/assets/media/uploads/2025/11/PREMIUM-01_SPESIAL-FOTO.jpg";
import puspaAsmaraThumbnail from "../templates/exclusive/puspa-asmara/assets/images/PREMIUM-02_SPESIAL-FOTO.jpg";

export const themes = [
  {
    slug: "blue-nature",
    presetId: "bun-basic-001",
    name: "Blue Nature",
    category: "Natural",
    packageTier: "BASIC",
    price: "Rp 99.000",
    description: "Nuansa biru natural dengan sentuhan gold dan tekstur floral yang hangat.",
    title: "The Wedding Of",
    couple: "Habib & Adiba",
    thumbnail: blueNatureThumbnail,
    image: blueNatureThumbnail,
    overlayClass: "bg-slate-900/20",
    cardClass: "bg-slate-100/70 hover:bg-slate-100",
    templateRoute: "/undangan/blue-nature",
  },
  {
    slug: "noir-minimalist",
    presetId: "nrm-basic-001",
    name: "Noir Minimalist",
    category: "Minimalist",
    packageTier: "BASIC",
    price: "Rp 99.000",
    description: "Migrasi pixel-perfect gaya luxury minimalist dengan cover lock, lottie, countdown, dan gift panel interaktif.",
    title: "The Wedding Of",
    couple: "Habib & Adiba",
    thumbnail: noirMinimalistThumbnail,
    image: noirMinimalistThumbnail,
    overlayClass: "bg-slate-900/25",
    cardClass: "bg-slate-100/70 hover:bg-slate-100",
    templateRoute: "/undangan/noir-minimalist",
  },
  {
    slug: "ivory-grace",
    presetId: "ivg-basic-001",
    name: "Ivory Grace",
    category: "Classic",
    packageTier: "BASIC",
    price: "Rp 99.000",
    description: "Migrasi pixel-perfect gaya minimalist luxury dari source Luxury 02 dengan cover lock, countdown, gift toggle, dan audio floating.",
    title: "The Wedding Of",
    couple: "Habib & Adiba",
    thumbnail: ivoryGraceThumbnail,
    image: ivoryGraceThumbnail,
    overlayClass: "bg-zinc-900/20",
    cardClass: "bg-zinc-100/70 hover:bg-zinc-100",
    templateRoute: "/undangan/ivory-grace",
  },
  {
    slug: "timeless-promise",
    presetId: "tlp-premium-001",
    name: "Timeless Promise",
    category: "Floral",
    packageTier: "PREMIUM",
    price: "Rp 149.000",
    description: "Template klasik hasil migrasi pixel-perfect dari source WordPress/Elementor.",
    title: "The Wedding Of",
    couple: "Adiba & Habib",
    thumbnail: timelessPromiseThumbnail,
    image: timelessPromiseThumbnail,
    overlayClass: "bg-amber-900/20",
    cardClass: "bg-amber-100/70 hover:bg-amber-100",
    templateRoute: "/undangan/timeless-promise",
  },
  {
    slug: "misty-romance",
    presetId: "mtr-premium-001",
    name: "Misty Romance",
    category: "Floral",
    packageTier: "PREMIUM",
    price: "Rp 149.000",
    description: "Template romantis dengan ambience misty, lottie burung, dan layout Elementor pixel-perfect.",
    title: "The Wedding Of",
    couple: "Habib & Adiba",
    thumbnail: mistyRomanceThumbnail,
    image: mistyRomanceThumbnail,
    overlayClass: "bg-zinc-900/20",
    cardClass: "bg-zinc-100/70 hover:bg-zinc-100",
    templateRoute: "/undangan/misty-romance",
  },
  {
    slug: "velvet-burgundy",
    presetId: "vlb-premium-001",
    name: "Velvet Burgundy",
    category: "Classic",
    packageTier: "PREMIUM",
    price: "Rp 149.000",
    description: "Migrasi pixel-perfect dari template WordPress/Elementor dengan nuansa burgundy elegan.",
    title: "The Wedding Of",
    couple: "Habib & Adiba",
    thumbnail: velvetBurgundyThumbnail,
    image: velvetBurgundyThumbnail,
    overlayClass: "bg-rose-900/20",
    cardClass: "bg-rose-100/70 hover:bg-rose-100",
    templateRoute: "/undangan/velvet-burgundy",
  },
  {
    slug: "botanical-elegance",
    presetId: "bte-exclusive-001",
    name: "Botanical Elegance",
    category: "Classic",
    packageTier: "EKSLUSIF",
    price: "Rp 149.000",
    description: "Migrasi pixel-perfect dari template premium WordPress/Elementor dengan detail botanical elegan.",
    title: "The Wedding Of",
    couple: "Habib & Adiba",
    thumbnail: botanicalEleganceThumbnail,
    image: botanicalEleganceThumbnail,
    overlayClass: "bg-slate-900/20",
    cardClass: "bg-slate-100/70 hover:bg-slate-100",
    templateRoute: "/undangan/botanical-elegance",
  },
  {
    slug: "puspa-asmara",
    presetId: "psa-exclusive-001",
    name: "Puspa Asmara",
    category: "Classic",
    packageTier: "EKSLUSIF",
    price: "Rp 149.000",
    description: "Migrasi pixel-perfect dari template WordPress/Elementor dengan komposisi floral klasik dan interaksi undangan lengkap.",
    title: "The Wedding Of",
    couple: "Habib & Adiba",
    thumbnail: puspaAsmaraThumbnail,
    image: puspaAsmaraThumbnail,
    overlayClass: "bg-amber-900/20",
    cardClass: "bg-amber-100/70 hover:bg-amber-100",
    templateRoute: "/undangan/puspa-asmara",
  }
];

export function getThemeBySlug(slug) {
  return themes.find((theme) => theme.slug === slug);
}

export function getThemeByPresetId(presetId) {
  return themes.find((theme) => theme.presetId === presetId);
}

export const invitationsByTheme = {
  "sage-romance": [
    {
      id: "sg-1",
      title: "Undangan Aulia & Reza",
      date: "12 Mei 2026",
      thumbnail:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDww_cCj1cLqjGgjlxH44eK1G8UB4UoxD-rTcUT0awQZDTRQMoJJSDFO4Qx7ILa-7ubzr_j0rwFFXHrcTsSRm7DuglmdZSztMzPVZih95LIXAj1DTVGyXgPBEX9Zm1L7z0VdqWqv4gIQGU0C78lW6siwNhNvWoL72Pf_oqqmPxE9LVIUF_2IrG0SW9AcrQWvDRImJGRU0Xhf3fvtF4zCiMXmQEuPZ-_Ur_xspB-gDf927QVZm6A3eXF8T3ZqdHhVqDmBefH0WK7P-ls",
    },
    {
      id: "sg-2",
      title: "Undangan Tania & Danu",
      date: "28 Juni 2026",
      thumbnail:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCq5o2G6c8U43H69KadZyZ3qDZfA_DbIMYqgrAOMjuJ31b75f0jLCnjgpapNc7YhJeIDoX-k9fQkjKTAKuhXVBI7Y0OpRnTwbvQ7DGjjOXouZFftquGyOPii1WxRpIpNhBCO72RiNUb0VGwgxWM0Ek7tqeDgSGn56I1K1LmKcPclP28cHMhU7hnwf17pzNk_ukLSh2f1lKS9omJc8_8RGfM83DTYerzk-zpMTi54F4fSUcJgEqrVmca9d_AMRULHi6MKBB6CGlz9U8I",
    },
  ],
  "blushing-peony": [
    {
      id: "bp-1",
      title: "Undangan Nisa & Hanif",
      date: "3 Juli 2026",
      thumbnail:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAsflsl_adbn0oqqfiu9fjq3ItiJKrlPqU17VYLBEjZnri1tWHP-Yn5tnoYJ1f4pGjNEflgA4ETPg9zVoGGQCd27yCXhpIFdEzRLVLzdu6Bieotx9uIig3pLXnxTxWIeOW1OpP1rKCt4o3gVLdrLUShKnyOOAhPrmLtbDxnwie8ISMb-oSwZQL3lF07wHNqta-QaEunG0t68ewnLARRF89uZX5gqkFUAkhErZVaMEnWH5qFRyjyqBA7pab70XdlPezeeVn1pRQC3QqA",
    },
    {
      id: "bp-2",
      title: "Undangan Dira & Bagus",
      date: "19 Agustus 2026",
      thumbnail:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAQSQ_836cyL6XxKE54c2eQuFCVsuD0_YQRo_22tNpIXnhqQBUTmnMfxuuujHTXXIVNxV3xsKOa0qqFOAr8WEvEt77zyE4SXDcKGqiA5J7aBAqkqpi8T7Vhpz2onShLU6KgmxKLkuZY6fI8BOZ09P7pEqKkQEnAso7jM9lgcsdHLLWW8ySai_3kBZSIhl8Tl0dLRR07mhX01AIq594s8p9A0fkQzE1TNJUxznfakSllgWewDMkg-niAy9SFrXwy-XqxsDHaqyYMm3KR",
    },
  ],
  "classic-elegance": [
    {
      id: "ce-1",
      title: "Undangan Rara & Ilham",
      date: "10 September 2026",
      thumbnail:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC_i6qVstOl5xlJ8zKWI8zvtR0nMVHLQxnbOpd6DmFKD1rZjzlayY6Xralsrv7Gc2hPLvGpGOZz0zi0uJ7iEw6xrZ2icBh1sXpK0ifUYVvvaABPLomYJ9DacxtpyT-vgRvqfem73GyKbqWXkcRmvHLtvO_EGBsSW2gWvXpabZksZ-zIJvf4KVca4LOu6MqSwMIijqECph7FC2rreB2FrjDuSE9e_6gv4Y2b-9nSGisO_5f9HsDbxYhcgI7OelTaml4kK84jpPYe6A4N",
    },
  ],
  "wooden-dream": [
    {
      id: "wd-1",
      title: "Undangan Maya & Arga",
      date: "2 Oktober 2026",
      thumbnail:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAQSQ_836cyL6XxKE54c2eQuFCVsuD0_YQRo_22tNpIXnhqQBUTmnMfxuuujHTXXIVNxV3xsKOa0qqFOAr8WEvEt77zyE4SXDcKGqiA5J7aBAqkqpi8T7Vhpz2onShLU6KgmxKLkuZY6fI8BOZ09P7pEqKkQEnAso7jM9lgcsdHLLWW8ySai_3kBZSIhl8Tl0dLRR07mhX01AIq594s8p9A0fkQzE1TNJUxznfakSllgWewDMkg-niAy9SFrXwy-XqxsDHaqyYMm3KR",
    },
  ],
  "emerald-syari": [
    {
      id: "es-1",
      title: "Undangan Nabila & Yusuf",
      date: "15 November 2026",
      thumbnail:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDQYbqkCcTu1-9T17kpI582nfZS3VxrUp69H45yUTRwRYaHuE5rShgy8ycvRDDUQC_CR9nM6J1wl2bZ5GA59OLUkaOGGnyV43aFh_u_B5Qf1H7zcfRs5aAxm0pSzB53i8ahrISuc8tG_dG2OKAo7H4m0F896gzNI1vK2Xl7RrTJhIcc2x2VWlwe8kgEqeYbCZT5uLcLaKfkJsi9fzP-x-dN-pxxvKBW2HzWlFLLeEEFzSpJnLc4puEyWi8UIC_kt1Gs4MwSbeBLHC8z",
    },
  ],
  "pastel-love": [
    {
      id: "pl-1",
      title: "Undangan Dinda & Fikri",
      date: "7 Desember 2026",
      thumbnail:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCq5o2G6c8U43H69KadZyZ3qDZfA_DbIMYqgrAOMjuJ31b75f0jLCnjgpapNc7YhJeIDoX-k9fQkjKTAKuhXVBI7Y0OpRnTwbvQ7DGjjOXouZFftquGyOPii1WxRpIpNhBCO72RiNUb0VGwgxWM0Ek7tqeDgSGn56I1K1LmKcPclP28cHMhU7hnwf17pzNk_ukLSh2f1lKS9omJc8_8RGfM83DTYerzk-zpMTi54F4fSUcJgEqrVmca9d_AMRULHi6MKBB6CGlz9U8I",
    },
  ],
};
