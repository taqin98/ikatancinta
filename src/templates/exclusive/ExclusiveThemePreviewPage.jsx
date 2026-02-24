import { useMemo, useState } from "react";
import { getThemeByPresetId } from "../../data/themes";

function getPresetIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("preset_id") || "";
}

export default function ExclusiveThemePreviewPage() {
  const presetId = getPresetIdFromUrl();
  const theme = getThemeByPresetId(presetId);
  const [opened, setOpened] = useState(false);

  const [groomName, brideName] = useMemo(() => {
    const parts = (theme?.couple || "Raka & Alya")
      .split("&")
      .map((part) => part.trim())
      .filter(Boolean);
    return [parts[0] || "Raka", parts[1] || "Alya"];
  }, [theme?.couple]);

  const gallery = useMemo(
    () => [
      theme?.thumbnail || theme?.image || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?auto=format&fit=crop&w=900&q=80",
    ],
    [theme?.thumbnail, theme?.image]
  );

  if (!theme) {
    return (
      <main className="min-h-screen bg-[#f8f4ef] px-4 py-10">
        <div className="mx-auto max-w-md rounded-3xl border border-[#e7ddd1] bg-white p-7 text-center">
          <h1 className="font-serif text-3xl text-[#5f4c2e] font-bold mb-2">Preview tidak ditemukan</h1>
          <p className="text-sm text-[#8d7a5d] mb-5">Preset tidak valid atau sudah tidak tersedia.</p>
          <a href="/tema" className="inline-flex rounded-full bg-[#1f2937] text-white px-5 py-2.5 text-sm font-bold">
            Kembali ke Galeri
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f7efe4_0%,#f3e6d6_48%,#f8f3eb_100%)] px-3 py-4 sm:px-5 sm:py-6">
      <article className="mx-auto max-w-[430px] overflow-hidden rounded-[2rem] border border-[#e6d9c9] bg-[#fdf9f3] shadow-soft">
        <section className="relative min-h-[560px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${theme.image || theme.thumbnail}')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#1f1a13]/40 via-[#3f3424]/35 to-[#fdf9f3]"></div>
          <div className="relative z-10 min-h-[560px] px-6 py-10 flex flex-col items-center text-center text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">Exclusive Wedding Invitation</p>
            <h1 className="mt-6 font-serif text-5xl leading-[0.9]">{theme.couple}</h1>
            <p className="mt-3 text-sm text-white/90">Sabtu, 28 Februari 2026</p>
            <div className="mt-auto w-full">
              <p className="font-serif italic text-2xl mb-3">{theme.title}</p>
              <button
                type="button"
                onClick={() => setOpened(true)}
                className="w-full rounded-full border border-white/60 bg-white/15 px-5 py-3 text-sm font-bold backdrop-blur hover:bg-white/25 transition"
              >
                Buka Undangan
              </button>
            </div>
          </div>
        </section>

        {opened ? (
          <>
            <section className="px-6 py-10 text-center bg-[#f1f5f9]">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#334155] mb-4">QS. Ar-Rum : 21</p>
              <p className="font-serif italic text-2xl leading-[1.5] text-[#6e5834]">
                Dan di antara tanda-tanda kebesaran-Nya diciptakan pasangan agar kamu merasa tenteram.
              </p>
            </section>

            <section className="px-6 py-10 bg-[#fffaf3]">
              <h2 className="text-center font-serif text-3xl text-[#1f2937] mb-7">Mempelai</h2>
              <div className="grid grid-cols-2 gap-3">
                <article className="rounded-3xl border border-[#e7d8c5] bg-white p-3 text-center">
                  <img src={gallery[0]} alt={`Foto ${groomName}`} className="w-full h-44 rounded-2xl object-cover" />
                  <p className="font-serif text-3xl text-[#1f2937] mt-3">{groomName}</p>
                  <p className="text-[11px] text-[#907d60]">Putra Pertama</p>
                </article>
                <article className="rounded-3xl border border-[#e7d8c5] bg-white p-3 text-center">
                  <img src={gallery[1]} alt={`Foto ${brideName}`} className="w-full h-44 rounded-2xl object-cover" />
                  <p className="font-serif text-3xl text-[#1f2937] mt-3">{brideName}</p>
                  <p className="text-[11px] text-[#907d60]">Putri Kedua</p>
                </article>
              </div>
            </section>

            <section className="px-6 py-10 bg-[#eef2f7]">
              <h2 className="text-center font-serif text-3xl text-[#1f2937] mb-6">Rangkaian Acara</h2>
              <div className="space-y-3">
                <article className="rounded-2xl border border-[#e3d4bf] bg-white/85 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#8e7447]">Akad Nikah</p>
                  <p className="text-sm text-[#6a5532] mt-1">Minggu, 10 Maret 2026 | 09.00 WIB</p>
                  <p className="text-xs text-[#8f7b5e] mt-1">Masjid Al Barkah, Bekasi</p>
                </article>
                <article className="rounded-2xl border border-[#e3d4bf] bg-white/85 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#8e7447]">Resepsi</p>
                  <p className="text-sm text-[#6a5532] mt-1">Minggu, 10 Maret 2026 | 11.00 WIB</p>
                  <p className="text-xs text-[#8f7b5e] mt-1">Ballroom Grand Mahkota, Jakarta</p>
                </article>
              </div>
            </section>

            <section className="px-6 py-10 bg-[#f8fafc]">
              <h2 className="text-center font-serif text-3xl text-[#1f2937] mb-6">Galeri</h2>
              <div className="grid grid-cols-2 gap-2">
                <img src={gallery[0]} alt="Galeri 1" className="h-36 w-full rounded-2xl object-cover" />
                <img src={gallery[1]} alt="Galeri 2" className="h-36 w-full rounded-2xl object-cover" />
                <img src={gallery[2]} alt="Galeri 3" className="h-36 w-full rounded-2xl object-cover" />
                <img src={gallery[3]} alt="Galeri 4" className="h-36 w-full rounded-2xl object-cover" />
              </div>
            </section>

            <section className="px-6 py-10 bg-[#eef2f7]">
              <h2 className="text-center font-serif text-3xl text-[#1f2937] mb-6">RSVP</h2>
              <form className="space-y-3">
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  className="w-full rounded-xl border border-[#dfd0bc] bg-white px-4 py-3 text-sm focus:outline-none"
                />
                <select className="w-full rounded-xl border border-[#dfd0bc] bg-white px-4 py-3 text-sm focus:outline-none">
                  <option>Konfirmasi Kehadiran</option>
                  <option>Hadir</option>
                  <option>Tidak Hadir</option>
                </select>
                <textarea
                  rows={4}
                  placeholder="Ucapan & doa"
                  className="w-full rounded-xl border border-[#dfd0bc] bg-white px-4 py-3 text-sm focus:outline-none"
                ></textarea>
                <button type="button" className="w-full rounded-full bg-[#1f2937] text-white py-3 text-sm font-bold">
                  Kirim RSVP
                </button>
              </form>
            </section>

            <footer className="px-6 py-6 text-center bg-[#efe3d3]">
              <p className="text-xs text-[#8f7c5f]">Terima kasih atas doa dan kehadirannya</p>
              <p className="text-xs font-semibold tracking-wide text-[#705a35] mt-2">wedding.ikatancinta.in</p>
            </footer>
          </>
        ) : (
          <section className="px-6 py-5 text-center bg-[#f9f1e5] border-t border-[#eadcc8]">
            <p className="text-sm text-[#8f7b5d]">Klik tombol Buka Undangan untuk melihat isi lengkap preview.</p>
          </section>
        )}
      </article>
    </main>
  );
}
