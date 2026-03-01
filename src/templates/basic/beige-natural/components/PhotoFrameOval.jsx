import { tokens } from "../tokens";

const FALLBACK_PHOTO =
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80";

export default function PhotoFrameOval({ src, alt = "Foto", width = "190px", height = "240px", aos, aosDelay }) {
    return (
        <div
            data-aos={aos}
            data-aos-delay={aosDelay}
            className="mx-auto"
            style={{
                width,
                height,
                borderRadius: tokens.radius.photoOval,
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
