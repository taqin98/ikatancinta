import { useMemo, useState } from "react";
import { tokens } from "../tokens";
import CoverImage from "../assets/decorations/cover.webp";
import CoupleImage from "../assets/decorations/couple.webp";

const PLACEHOLDERS = [
    CoupleImage,
    CoverImage,
    CoupleImage,
    CoverImage,
    CoupleImage,
    CoverImage,
];

export default function GalleryGrid({ photos = [] }) {
    const [lightbox, setLightbox] = useState(null);
    const displayPhotos = useMemo(() => (photos.length > 0 ? photos : PLACEHOLDERS), [photos]);

    return (
        <>
            <div className="grid grid-cols-2 gap-3">
                {displayPhotos.map((photo, index) => (
                    <button
                        key={`${photo}-${index}`}
                        data-aos="fade-up"
                        data-aos-delay={index * 80}
                        onClick={() => setLightbox(index)}
                        style={{
                            borderRadius: "16px",
                            overflow: "hidden",
                            border: `1px solid ${tokens.colors.cardBorder}`,
                            boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                            aspectRatio: "4 / 5",
                            background: tokens.colors.white,
                        }}
                        aria-label={`Buka foto ${index + 1}`}
                    >
                        <img src={photo} alt={`Galeri ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>

            {lightbox !== null ? (
                <div
                    onClick={() => setLightbox(null)}
                    className="fixed inset-0 z-[80] flex items-center justify-center px-4"
                    style={{ background: "rgba(20,14,10,0.85)" }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") setLightbox(null);
                    }}
                >
                    <button
                        onClick={() => setLightbox(null)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full"
                        style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none" }}
                        aria-label="Tutup"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <div onClick={(event) => event.stopPropagation()}>
                        <img
                            src={displayPhotos[lightbox]}
                            alt={`Galeri ${lightbox + 1}`}
                            className="w-full max-w-[420px] max-h-[78dvh] object-contain rounded-2xl"
                        />
                    </div>
                </div>
            ) : null}
        </>
    );
}
