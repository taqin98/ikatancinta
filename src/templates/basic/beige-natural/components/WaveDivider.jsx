import { tokens } from "../tokens";

export default function WaveDivider({ flip = false }) {
    return (
        <div style={{ lineHeight: 0, transform: flip ? "scaleY(-1)" : "none" }} aria-hidden="true">
            <svg viewBox="0 0 430 72" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M0 30C44 48 86 58 129 56C172 53 215 35 258 29C301 24 344 32 387 44C402 48 416 52 430 56V72H0V30Z"
                    fill={tokens.colors.sectionAlt}
                />
            </svg>
        </div>
    );
}
