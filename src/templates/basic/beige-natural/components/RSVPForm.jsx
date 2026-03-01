import { useMemo, useState } from "react";
import { tokens } from "../tokens";
import ButtonPill from "./ButtonPill";

const INITIAL = [
    {
        id: 1,
        name: "Dina",
        location: "Bekasi",
        status: "hadir",
        message: "Selamat menempuh hidup baru, semoga menjadi keluarga yang sakinah.",
        time: "2 hari lalu",
    },
    {
        id: 2,
        name: "Our Wedding Link",
        location: "Jakarta",
        status: "hadir",
        message: "Turut berbahagia untuk kalian berdua.",
        time: "3 hari lalu",
    },
];

function initialsOf(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
}

export default function RSVPForm() {
    const [comments, setComments] = useState(INITIAL);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", location: "", status: "hadir", message: "" });

    const hadir = useMemo(() => comments.filter((item) => item.status === "hadir").length, [comments]);
    const tidakHadir = useMemo(() => comments.filter((item) => item.status !== "hadir").length, [comments]);

    function handleSubmit(event) {
        event.preventDefault();

        if (!form.name.trim()) {
            setError("Nama wajib diisi.");
            return;
        }
        if (!form.message.trim()) {
            setError("Ucapan wajib diisi.");
            return;
        }

        setError("");
        setSubmitting(true);

        setTimeout(() => {
            setComments((prev) => [
                {
                    id: Date.now(),
                    name: form.name.trim(),
                    location: form.location.trim() || "-",
                    status: form.status,
                    message: form.message.trim(),
                    time: "Baru saja",
                },
                ...prev,
            ]);
            setForm({ name: "", location: "", status: "hadir", message: "" });
            setSubmitting(false);
        }, 500);
    }

    const inputStyle = {
        width: "100%",
        padding: "11px 14px",
        borderRadius: "12px",
        border: `1px solid ${tokens.colors.cardBorder}`,
        fontFamily: tokens.fonts.sans,
        fontSize: "0.84rem",
        color: tokens.colors.textDark,
        background: tokens.colors.white,
        outline: "none",
    };

    return (
        <div>
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div data-aos="fade-up" style={{ borderRadius: "14px", border: "1px solid rgba(22,163,74,0.25)", background: tokens.colors.hadirBg, padding: "12px" }}>
                    <p style={{ fontFamily: tokens.fonts.display, fontSize: "1.45rem", color: tokens.colors.hadirText, fontWeight: 700, lineHeight: 1 }}>{hadir}</p>
                    <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.73rem", color: tokens.colors.hadirText }}>Hadir</p>
                </div>
                <div data-aos="fade-up" data-aos-delay="80" style={{ borderRadius: "14px", border: "1px solid rgba(185,28,28,0.22)", background: tokens.colors.tidakHadirBg, padding: "12px" }}>
                    <p style={{ fontFamily: tokens.fonts.display, fontSize: "1.45rem", color: tokens.colors.tidakHadirText, fontWeight: 700, lineHeight: 1 }}>{tidakHadir}</p>
                    <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.73rem", color: tokens.colors.tidakHadirText }}>Tidak Hadir</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ borderRadius: tokens.radius.card, border: `1px solid ${tokens.colors.cardBorder}`, boxShadow: tokens.shadow.card, background: tokens.colors.white, padding: "18px", marginBottom: "18px" }}>
                <div data-aos="fade-up" data-aos-delay="0" className="mb-2">
                    <input
                        type="text"
                        value={form.name}
                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Nama lengkap"
                        style={inputStyle}
                    />
                </div>
                <div data-aos="fade-up" data-aos-delay="70" className="mb-2">
                    <input
                        type="text"
                        value={form.location}
                        onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                        placeholder="Alamat / kota"
                        style={inputStyle}
                    />
                </div>
                <div data-aos="fade-up" data-aos-delay="140" className="mb-2">
                    <select
                        value={form.status}
                        onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                        style={inputStyle}
                    >
                        <option value="hadir">Hadir</option>
                        <option value="tidak">Tidak Hadir</option>
                    </select>
                </div>
                <div data-aos="fade-up" data-aos-delay="210" className="mb-2">
                    <textarea
                        rows={3}
                        value={form.message}
                        onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                        placeholder="Ucapan dan doa"
                        style={{ ...inputStyle, resize: "vertical" }}
                    />
                </div>

                {error ? (
                    <p style={{ marginBottom: "10px", fontFamily: tokens.fonts.sans, color: tokens.colors.tidakHadirText, fontSize: "0.74rem" }} role="alert">
                        {error}
                    </p>
                ) : null}

                <div data-aos="zoom-in" data-aos-delay="280">
                    <ButtonPill type="submit" icon={submitting ? "hourglass_top" : "send"} style={{ width: "100%" }}>
                        {submitting ? "Mengirim..." : "Kirim Ucapan"}
                    </ButtonPill>
                </div>
            </form>

            <div className="space-y-3">
                {comments.map((item, index) => (
                    <article
                        key={item.id}
                        data-aos="fade-up"
                        data-aos-delay={index * 60}
                        style={{
                            borderRadius: "14px",
                            border: `1px solid ${tokens.colors.cardBorder}`,
                            background: tokens.colors.white,
                            padding: "12px",
                            display: "flex",
                            gap: "10px",
                        }}
                    >
                        <div
                            style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "999px",
                                background: tokens.colors.primaryBrown,
                                color: tokens.colors.white,
                                fontFamily: tokens.fonts.display,
                                fontSize: "0.72rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                fontWeight: 700,
                            }}
                        >
                            {initialsOf(item.name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                                <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.82rem", color: tokens.colors.textDark, fontWeight: 600 }}>
                                    {item.name}
                                </p>
                                <span style={{ fontFamily: tokens.fonts.sans, fontSize: "0.66rem", color: tokens.colors.textSoft }}>
                                    {item.time}
                                </span>
                            </div>
                            <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.72rem", color: tokens.colors.textMuted, marginBottom: "2px" }}>{item.location}</p>
                            <p style={{ fontFamily: tokens.fonts.sans, fontSize: "0.78rem", color: tokens.colors.textDark, lineHeight: 1.6 }}>{item.message}</p>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
