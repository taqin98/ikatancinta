import { tokens } from "../tokens";

export default function FloralDivider({ className = "" }) {
    return (
        <div className={`flex items-center justify-center gap-2 my-6 ${className}`} aria-hidden="true">
            <div
                className="h-px flex-1 max-w-[60px]"
                style={{
                    background: `linear-gradient(90deg, transparent, ${tokens.colors.divider})`,
                }}
            />
            <svg width="48" height="20" viewBox="0 0 80 24" fill="none">
                {/* Left small petal */}
                <ellipse cx="18" cy="12" rx="7" ry="4" fill={tokens.colors.accent} opacity="0.25" transform="rotate(-25 18 12)" />
                {/* Center flower */}
                <circle cx="40" cy="12" r="5" fill={tokens.colors.accent} opacity="0.20" />
                <circle cx="40" cy="12" r="2.5" fill={tokens.colors.accent} opacity="0.45" />
                {/* Petals */}
                <ellipse cx="40" cy="6" rx="2" ry="3.5" fill={tokens.colors.accent} opacity="0.20" />
                <ellipse cx="40" cy="18" rx="2" ry="3.5" fill={tokens.colors.accent} opacity="0.20" />
                <ellipse cx="34" cy="12" rx="3.5" ry="2" fill={tokens.colors.accent} opacity="0.20" />
                <ellipse cx="46" cy="12" rx="3.5" ry="2" fill={tokens.colors.accent} opacity="0.20" />
                {/* Right small petal */}
                <ellipse cx="62" cy="12" rx="7" ry="4" fill={tokens.colors.accent} opacity="0.25" transform="rotate(25 62 12)" />
                {/* Dots */}
                <circle cx="26" cy="12" r="1.5" fill={tokens.colors.accent} opacity="0.30" />
                <circle cx="54" cy="12" r="1.5" fill={tokens.colors.accent} opacity="0.30" />
            </svg>
            <div
                className="h-px flex-1 max-w-[60px]"
                style={{
                    background: `linear-gradient(90deg, ${tokens.colors.divider}, transparent)`,
                }}
            />
        </div>
    );
}
