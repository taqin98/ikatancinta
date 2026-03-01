import { useState } from "react";
import { tokens } from "../tokens";

export default function GiftEnvelope({ bankList = [], aos }) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(null);

    function copyText(text, id) {
        navigator.clipboard.writeText(text).catch(() => { });
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    }

    return (
        <>
            <div
                data-aos={aos}
                className="rounded-2xl p-6 text-center"
                style={{
                    background: tokens.colors.cardBg,
                    border: `1px solid ${tokens.colors.cardBorder}`,
                    boxShadow: tokens.shadow.card,
                }}
            >
                {/* Icon */}
                <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: tokens.colors.accentSoft }}
                >
                    <span className="material-symbols-outlined text-2xl" style={{ color: tokens.colors.accent }}>
                        card_giftcard
                    </span>
                </div>

                <h3
                    style={{ fontFamily: tokens.fonts.serif, color: tokens.colors.headingText, fontSize: "1.2rem" }}
                    className="font-bold italic mb-2"
                >
                    Amplop Digital
                </h3>
                <p
                    className="text-xs leading-relaxed mb-4"
                    style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.mutedText }}
                >
                    Bagi yang ingin memberikan hadiah dalam bentuk digital, kami menerima dengan penuh rasa syukur.
                </p>

                <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                    style={{
                        background: tokens.colors.accent,
                        color: tokens.colors.white,
                        fontFamily: tokens.fonts.sans,
                        boxShadow: tokens.shadow.button,
                        border: "none",
                    }}
                >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    Klik Disini
                </button>
            </div>

            {/* Modal */}
            {open && (
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center"
                    style={{ background: "rgba(10,20,40,0.7)" }}
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="w-full max-w-sm rounded-t-3xl p-6 pb-10"
                        style={{ background: tokens.colors.white, boxShadow: "0 -4px 40px rgba(0,0,0,0.15)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle */}
                        <div className="w-10 h-1.5 rounded-full mx-auto mb-4" style={{ background: tokens.colors.cardBorder }} />

                        <h4
                            style={{ fontFamily: tokens.fonts.serif, color: tokens.colors.headingText, fontSize: "1.3rem" }}
                            className="italic font-bold text-center mb-4"
                        >
                            Info Rekening
                        </h4>

                        <div className="space-y-3">
                            {bankList.map((item, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl p-4"
                                    style={{
                                        background: tokens.colors.accentSoft,
                                        border: `1px solid ${tokens.colors.cardBorder}`,
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold mb-0.5" style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.mutedText }}>
                                                {item.bank}
                                            </p>
                                            <p className="text-lg font-bold" style={{ fontFamily: tokens.fonts.serif, color: tokens.colors.headingText, letterSpacing: "0.05em" }}>
                                                {item.account}
                                            </p>
                                            <p className="text-xs" style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.bodyText }}>
                                                a.n. {item.name}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => copyText(item.account, i)}
                                            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                                            style={{
                                                background: copied === i ? tokens.colors.hadirBg : tokens.colors.accentSoft,
                                                border: `1px solid ${tokens.colors.cardBorder}`,
                                            }}
                                        >
                                            <span
                                                className="material-symbols-outlined text-sm"
                                                style={{ color: copied === i ? tokens.colors.hadirText : tokens.colors.accent }}
                                            >
                                                {copied === i ? "check" : "content_copy"}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setOpen(false)}
                            className="w-full mt-5 py-3 rounded-full text-sm font-semibold"
                            style={{
                                background: tokens.colors.accentSoft,
                                color: tokens.colors.accent,
                                fontFamily: tokens.fonts.sans,
                                border: `1px solid ${tokens.colors.cardBorder}`,
                            }}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
