import { tokens } from "../tokens";

const FALLBACK_PHOTO =
    "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80";

export default function PhotoFrameArch({ src, alt = "Foto pasangan", width = "220px", height = "290px", aos, aosDelay }) {
    return (
        <div
            data-aos={aos}
            data-aos-delay={aosDelay}
            className="mx-auto"
            style={{
                width,
                height,
                borderRadius: tokens.radius.photoArch,
                overflow: "hidden",
                boxShadow: tokens.shadow.photo,
                border: `12px solid ${tokens.colors.white}`,
                background: tokens.colors.accentSoft,
            }}
        >
            <img src={src || FALLBACK_PHOTO} alt={alt} className="w-full h-full object-cover" />
        </div>
    );
}
