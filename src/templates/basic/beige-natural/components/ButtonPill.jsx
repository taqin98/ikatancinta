import { tokens } from "../tokens";

export default function ButtonPill({
    children,
    onClick,
    href,
    icon,
    light = false,
    type = "button",
    className = "",
    style = {},
    dataAos,
    dataAosDelay,
}) {
    const content = (
        <>
            {icon ? <span className="material-symbols-outlined text-base">{icon}</span> : null}
            <span>{children}</span>
        </>
    );

    const baseStyle = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "12px 24px",
        borderRadius: tokens.radius.pill,
        border: light ? `1.4px solid ${tokens.colors.white}` : "none",
        background: light ? "rgba(255,255,255,0.16)" : tokens.colors.primaryBrown,
        color: light ? tokens.colors.white : tokens.colors.white,
        boxShadow: light ? "0 10px 20px rgba(0,0,0,0.16)" : tokens.shadow.button,
        backdropFilter: light ? "blur(6px)" : "none",
        fontFamily: tokens.fonts.sans,
        fontWeight: 600,
        fontSize: "0.86rem",
        letterSpacing: "0.03em",
        textDecoration: "none",
        cursor: "pointer",
        transition: "transform 0.2s ease",
        ...style,
    };

    if (href) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={className}
                style={baseStyle}
                data-aos={dataAos}
                data-aos-delay={dataAosDelay}
            >
                {content}
            </a>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            className={className}
            style={baseStyle}
            data-aos={dataAos}
            data-aos-delay={dataAosDelay}
        >
            {content}
        </button>
    );
}
