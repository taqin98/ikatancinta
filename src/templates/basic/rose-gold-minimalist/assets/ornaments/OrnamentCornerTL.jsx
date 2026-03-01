/** Geometric corner ornament — top left (thin lines + diamond accent) */
export default function OrnamentCornerTL({ size = 120, color = "#C9956C", opacity = 0.35 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* L-shaped corner lines */}
            <path d="M4 4 L4 80" stroke={color} strokeWidth="0.8" opacity={opacity} />
            <path d="M4 4 L80 4" stroke={color} strokeWidth="0.8" opacity={opacity} />
            <path d="M12 12 L12 68" stroke={color} strokeWidth="0.5" opacity={opacity * 0.6} />
            <path d="M12 12 L68 12" stroke={color} strokeWidth="0.5" opacity={opacity * 0.6} />

            {/* Diamond accent at corner junction */}
            <rect x="2" y="2" width="5" height="5" transform="rotate(45 4.5 4.5)" fill={color} opacity={opacity} />

            {/* Small decorative dots */}
            <circle cx="20" cy="4" r="1.5" fill={color} opacity={opacity * 0.7} />
            <circle cx="36" cy="4" r="1" fill={color} opacity={opacity * 0.5} />
            <circle cx="4" cy="20" r="1.5" fill={color} opacity={opacity * 0.7} />
            <circle cx="4" cy="36" r="1" fill={color} opacity={opacity * 0.5} />

            {/* Thin diagonal flourish */}
            <path d="M20 20 L50 50" stroke={color} strokeWidth="0.4" opacity={opacity * 0.3} strokeDasharray="3 4" />
        </svg>
    );
}
