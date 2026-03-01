import { tokens } from "../tokens";

export default function SectionShell({ id, children, alt = false, style = {}, className = "" }) {
    return (
        <section
            id={id}
            className={className}
            style={{
                width: "100%",
                padding: "58px 20px",
                position: "relative",
                overflow: "hidden",
                background: alt
                    ? `radial-gradient(circle at 20% 0%, rgba(255,255,255,0.72) 0%, rgba(251,247,240,1) 55%), ${tokens.colors.sectionAlt}`
                    : `radial-gradient(circle at 90% 10%, rgba(255,255,255,0.84) 0%, rgba(246,240,230,0.4) 55%), ${tokens.colors.white}`,
                ...style,
            }}
        >
            {children}
        </section>
    );
}
