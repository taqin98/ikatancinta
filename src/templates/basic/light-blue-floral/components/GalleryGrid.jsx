import { useState } from "react";
import { tokens } from "../tokens";

const PLACEHOLDER_PHOTOS = [
    "https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=400&q=80",
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80",
    "https://images.unsplash.com/photo-1526341163020-a4b1c7ceebb7?w=400&q=80",
    "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&q=80",
    "https://images.unsplash.com/photo-1529636798458-92182e662485?w=400&q=80",
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&q=80",
];

export default function GalleryGrid({ photos = [], aos, aosDelay }) {
    const [lightbox, setLightbox] = useState(null);
    const displayPhotos = photos.length > 0 ? photos : PLACEHOLDER_PHOTOS;

    return (
        <>
            <div className="grid grid-cols-2 gap-2.5" data-aos={aos}>
                {displayPhotos.map((src, i) => (
                    <button
                        key={i}
                        className="block w-full overflow-hidden focus:outline-none"
                        style={{ borderRadius: "0.875rem", boxShadow: tokens.shadow.card }}
                        onClick={() => setLightbox(src)}
                        data-aos="fade-up"
                        data-aos-delay={i * 80}
                    >
                        <img
                            src={src}
                            alt={`Galeri ${i + 1}`}
                            className="w-full aspect-square object-cover transition-transform duration-500 hover:scale-105"
                            loading="lazy"
                        />
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    style={{ background: "rgba(10,20,40,0.92)" }}
                    onClick={() => setLightbox(null)}
                >
                    <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={lightbox}
                            alt="Galeri full"
                            className="w-full rounded-2xl"
                            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
                        />
                        <button
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: tokens.colors.accent, color: tokens.colors.white, boxShadow: tokens.shadow.button }}
                            onClick={() => setLightbox(null)}
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
