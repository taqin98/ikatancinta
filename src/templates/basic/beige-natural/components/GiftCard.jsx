import { useState } from "react";
import { tokens } from "../tokens";
import ButtonPill from "./ButtonPill";

export default function GiftCard({ bankList = [] }) {
    const [copied, setCopied] = useState(null);

    async function copyAccount(account, index) {
        try {
            await navigator.clipboard.writeText(account);
            setCopied(index);
            setTimeout(() => setCopied(null), 1500);
        } catch {
            setCopied(null);
        }
    }

    return (
        <div className="space-y-3">
            {bankList.map((bank, index) => (
                <article
                    key={`${bank.bank}-${bank.account}-${index}`}
                    data-aos="fade-up"
                    data-aos-delay={index * 120}
                    style={{
                        borderRadius: "16px",
                        border: `1px solid ${tokens.colors.cardBorder}`,
                        background: tokens.colors.white,
                        padding: "16px",
                        boxShadow: tokens.shadow.card,
                    }}
                >
                    <p
                        style={{
                            fontFamily: tokens.fonts.display,
                            letterSpacing: "0.14em",
                            fontSize: "0.7rem",
                            textTransform: "uppercase",
                            color: tokens.colors.textSoft,
                        }}
                    >
                        {bank.bank}
                    </p>
                    <p style={{ fontFamily: tokens.fonts.display, color: tokens.colors.textDark, fontWeight: 700, fontSize: "1.2rem", marginTop: "2px" }}>
                        {bank.account}
                    </p>
                    <p style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.textMuted, fontSize: "0.78rem", marginBottom: "10px" }}>
                        a.n. {bank.name}
                    </p>
                    <ButtonPill
                        onClick={() => copyAccount(bank.account, index)}
                        icon={copied === index ? "check" : "content_copy"}
                        style={{ padding: "10px 16px", fontSize: "0.76rem" }}
                    >
                        {copied === index ? "Tersalin" : "Salin Nomor"}
                    </ButtonPill>
                </article>
            ))}
        </div>
    );
}
