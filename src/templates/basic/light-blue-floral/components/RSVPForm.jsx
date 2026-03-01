import { useState } from "react";
import { tokens } from "../tokens";

const INITIAL_COMMENTS = [
    {
        id: 1,
        name: "Budi Santoso",
        message: "Selamat atas pernikahan kalian! Semoga menjadi keluarga yang sakinah, mawaddah, wa rahmah. 🤍",
        status: "hadir",
        time: "2 hari lalu",
        initials: "BS",
        color: "#5B8DB8",
    },
    {
        id: 2,
        name: "Sari Dewi",
        message: "Barakallahu lakuma wa baraka alaykuma wa jama'a baynakuma fi khayr. Semoga langgeng ya!",
        status: "hadir",
        time: "3 hari lalu",
        initials: "SD",
        color: "#7B68EE",
    },
];

export default function RSVPForm({ groomNick, brideNick, aos }) {
    const [comments, setComments] = useState(INITIAL_COMMENTS);
    const [form, setForm] = useState({ name: "", message: "", status: "hadir" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const hadir = comments.filter((c) => c.status === "hadir").length;
    const tidakHadir = comments.filter((c) => c.status === "tidak").length;

    function randomColor() {
        const hues = [210, 240, 190, 270, 160];
        return `hsl(${hues[Math.floor(Math.random() * hues.length)]},55%,55%)`;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!form.name.trim()) { setError("Nama tidak boleh kosong."); return; }
        if (!form.message.trim()) { setError("Ucapan tidak boleh kosong."); return; }
        setError("");
        setSubmitting(true);
        setTimeout(() => {
            setComments((prev) => [
                {
                    id: Date.now(),
                    name: form.name.trim(),
                    message: form.message.trim(),
                    status: form.status,
                    time: "Baru saja",
                    initials: form.name.trim().slice(0, 2).toUpperCase(),
                    color: randomColor(),
                },
                ...prev,
            ]);
            setForm({ name: "", message: "", status: "hadir" });
            setSubmitting(false);
        }, 600);
    }

    const inputStyle = {
        width: "100%",
        padding: "10px 14px",
        borderRadius: "0.75rem",
        border: `1px solid ${tokens.colors.cardBorder}`,
        background: "rgba(255,255,255,0.8)",
        fontFamily: tokens.fonts.sans,
        fontSize: "0.85rem",
        color: tokens.colors.bodyText,
        outline: "none",
        marginBottom: "10px",
    };

    return (
        <div data-aos={aos}>
            {/* Stats */}
            <div className="flex gap-3 mb-6">
                <div
                    className="flex-1 flex items-center gap-2 rounded-xl p-3"
                    style={{ background: tokens.colors.hadirBg, border: `1px solid rgba(34,197,94,0.2)` }}
                >
                    <span className="material-symbols-outlined text-lg" style={{ color: tokens.colors.hadirText }}>check_circle</span>
                    <div>
                        <p style={{ fontFamily: tokens.fonts.sans, fontWeight: 700, color: tokens.colors.hadirText }} className="text-2xl leading-none">{hadir}</p>
                        <p style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.hadirText, fontSize: "0.7rem" }}>Hadir</p>
                    </div>
                </div>
                <div
                    className="flex-1 flex items-center gap-2 rounded-xl p-3"
                    style={{ background: tokens.colors.tidakHadirBg, border: `1px solid rgba(239,68,68,0.15)` }}
                >
                    <span className="material-symbols-outlined text-lg" style={{ color: tokens.colors.tidakHadirText }}>cancel</span>
                    <div>
                        <p style={{ fontFamily: tokens.fonts.sans, fontWeight: 700, color: tokens.colors.tidakHadirText }} className="text-2xl leading-none">{tidakHadir}</p>
                        <p style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.tidakHadirText, fontSize: "0.7rem" }}>Tidak Hadir</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ background: tokens.colors.accentSoft, borderRadius: tokens.radius.card, padding: "18px" }} className="mb-6">
                <p style={{ fontFamily: tokens.fonts.sans, fontWeight: 600, color: tokens.colors.headingText, marginBottom: "12px", fontSize: "0.9rem" }}>
                    Kirim Ucapan & Doa Restu
                </p>
                {error && (
                    <p className="text-xs mb-2 px-3 py-2 rounded-lg" role="alert" style={{ background: tokens.colors.tidakHadirBg, color: tokens.colors.tidakHadirText, fontFamily: tokens.fonts.sans }}>
                        {error}
                    </p>
                )}
                <input
                    type="text"
                    placeholder="Nama lengkap Anda"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    style={inputStyle}
                />
                <textarea
                    rows={3}
                    placeholder="Tulis ucapan dan doa untuk kedua mempelai..."
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    style={{ ...inputStyle, resize: "none" }}
                />
                {/* Status radio */}
                <div className="flex gap-2 mb-3">
                    {[{ value: "hadir", label: "✓ Hadir" }, { value: "tidak", label: "✗ Tidak Hadir" }].map(({ value, label }) => (
                        <label
                            key={value}
                            className="flex-1 text-center text-xs py-2 rounded-full cursor-pointer transition-all"
                            style={{
                                fontFamily: tokens.fonts.sans,
                                fontWeight: form.status === value ? 600 : 400,
                                background: form.status === value ? tokens.colors.accent : "rgba(255,255,255,0.6)",
                                color: form.status === value ? tokens.colors.white : tokens.colors.bodyText,
                                border: `1px solid ${form.status === value ? tokens.colors.accent : tokens.colors.cardBorder}`,
                            }}
                        >
                            <input
                                type="radio"
                                value={value}
                                checked={form.status === value}
                                onChange={() => setForm((f) => ({ ...f, status: value }))}
                                className="sr-only"
                            />
                            {label}
                        </label>
                    ))}
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-full text-sm font-semibold transition-all"
                    style={{
                        background: submitting ? tokens.colors.mutedText : tokens.colors.accent,
                        color: tokens.colors.white,
                        fontFamily: tokens.fonts.sans,
                        boxShadow: tokens.shadow.button,
                        border: "none",
                        cursor: submitting ? "not-allowed" : "pointer",
                    }}
                >
                    {submitting ? "Mengirim..." : "Kirim Ucapan 💌"}
                </button>
            </form>

            {/* Comment list */}
            <div className="space-y-3">
                <p className="text-xs font-semibold mb-2" style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.mutedText }}>
                    {comments.length} Ucapan
                </p>
                {comments.map((c) => (
                    <div
                        key={c.id}
                        className="flex gap-3"
                        style={{
                            background: tokens.colors.cardBg,
                            border: `1px solid ${tokens.colors.cardBorder}`,
                            borderRadius: "0.875rem",
                            padding: "12px 14px",
                        }}
                    >
                        <div
                            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: c.color }}
                        >
                            {c.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-sm truncate" style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.headingText }}>{c.name}</p>
                                <span className="text-xs flex-shrink-0 ml-2" style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.mutedText }}>{c.time}</span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ fontFamily: tokens.fonts.sans, color: tokens.colors.bodyText }}>{c.message}</p>
                            <span
                                className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
                                style={{
                                    background: c.status === "hadir" ? tokens.colors.hadirBg : tokens.colors.tidakHadirBg,
                                    color: c.status === "hadir" ? tokens.colors.hadirText : tokens.colors.tidakHadirText,
                                    fontFamily: tokens.fonts.sans,
                                    fontWeight: 500,
                                }}
                            >
                                {c.status === "hadir" ? "✓ Hadir" : "✗ Tidak Hadir"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
