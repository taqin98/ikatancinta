export default function OrnamentTopLeft({ className = "", size = 160 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <g opacity="0.55">
                {/* Main branch */}
                <path d="M10 150 Q30 100 60 70 Q90 40 140 10" stroke="#5B8DB8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                {/* Leaf 1 */}
                <path d="M60 70 Q45 50 30 55 Q45 65 60 70Z" fill="#A8C8E8" opacity="0.7" />
                <path d="M60 70 Q55 48 42 50 Q52 62 60 70Z" fill="#C5DCF0" opacity="0.6" />
                {/* Leaf 2 */}
                <path d="M90 40 Q72 28 65 38 Q78 42 90 40Z" fill="#A8C8E8" opacity="0.7" />
                <path d="M90 40 Q80 22 70 30 Q80 36 90 40Z" fill="#C5DCF0" opacity="0.6" />
                {/* Petal cluster 1 */}
                <circle cx="35" cy="52" r="7" fill="#D6EAF8" opacity="0.6" />
                <circle cx="28" cy="48" r="5" fill="#E8F4FC" opacity="0.7" />
                <circle cx="42" cy="46" r="4" fill="#BDD9EE" opacity="0.6" />
                {/* Petal cluster 2 */}
                <circle cx="108" cy="22" r="6" fill="#D6EAF8" opacity="0.6" />
                <circle cx="115" cy="17" r="4" fill="#E8F4FC" opacity="0.7" />
                <circle cx="102" cy="16" r="3" fill="#BDD9EE" opacity="0.5" />
                {/* Small buds */}
                <circle cx="75" cy="55" r="3" fill="#A8C8E8" opacity="0.5" />
                <circle cx="50" cy="85" r="2.5" fill="#C5DCF0" opacity="0.5" />
                <circle cx="130" cy="25" r="2" fill="#BDD9EE" opacity="0.5" />
                {/* Leaf 3 */}
                <path d="M40 88 Q25 78 24 90 Q34 90 40 88Z" fill="#A8C8E8" opacity="0.55" />
            </g>
        </svg>
    );
}
