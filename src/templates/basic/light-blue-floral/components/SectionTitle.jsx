import { tokens } from "../tokens";

export default function SectionTitle({ title, subtitle, light = false, aos, aosDelay }) {
    const headingStyle = {
        fontFamily: tokens.fonts.serif,
        color: light ? tokens.colors.white : tokens.colors.headingText,
    };
    const subtitleStyle = {
        fontFamily: tokens.fonts.sans,
        color: light ? "rgba(255,255,255,0.8)" : tokens.colors.mutedText,
    };
    const dividerStyle = {
        background: light
            ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)"
            : `linear-gradient(90deg, transparent, ${tokens.colors.accent}, transparent)`,
    };

    return (
        <div className="text-center mb-8" data-aos={aos} data-aos-delay={aosDelay}>
            <h2 style={headingStyle} className="text-3xl font-bold italic mb-2 leading-tight">
                {title}
            </h2>
            <div className="flex items-center justify-center gap-3 my-3">
                <div className="h-px w-10" style={dividerStyle} />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                        d="M12 2C9.5 6 5 7 2 12C5 17 9.5 18 12 22C14.5 18 19 17 22 12C19 7 14.5 6 12 2Z"
                        fill={light ? "rgba(255,255,255,0.6)" : tokens.colors.accent}
                        opacity="0.7"
                    />
                </svg>
                <div className="h-px w-10" style={dividerStyle} />
            </div>
            {subtitle && (
                <p style={subtitleStyle} className="text-sm leading-relaxed max-w-xs mx-auto">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
