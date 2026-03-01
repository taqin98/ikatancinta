export default function OrnamentBottomLeft({ className = "", size = 140 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 140 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
            style={{ transform: "scaleY(-1)" }}
        >
            <g opacity="0.50">
                <path d="M10 130 Q30 80 55 55 Q80 30 130 10" stroke="#5B8DB8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M55 55 Q38 42 28 50 Q42 56 55 55Z" fill="#A8C8E8" opacity="0.65" />
                <path d="M80 32 Q65 20 60 30 Q72 34 80 32Z" fill="#A8C8E8" opacity="0.65" />
                <circle cx="30" cy="48" r="6.5" fill="#D6EAF8" opacity="0.6" />
                <circle cx="23" cy="44" r="4.5" fill="#E8F4FC" opacity="0.7" />
                <circle cx="100" cy="18" r="5.5" fill="#D6EAF8" opacity="0.55" />
                <circle cx="107" cy="14" r="3.5" fill="#E8F4FC" opacity="0.6" />
                <circle cx="68" cy="43" r="2.5" fill="#A8C8E8" opacity="0.5" />
                <circle cx="42" cy="72" r="2" fill="#C5DCF0" opacity="0.5" />
            </g>
        </svg>
    );
}
