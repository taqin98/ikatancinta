import { useMemo, useState } from "react";
import { getThemeByPresetId } from "../data/themes";
import { toAppPath } from "../utils/navigation";

function getPresetIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("preset_id") || "";
}

export default function InvitationPreviewPage() {
  const presetId = getPresetIdFromUrl();
  const theme = getThemeByPresetId(presetId);
  const [isOpened, setIsOpened] = useState(false);

  const mapLink = "https://maps.app.goo.gl/5Qh9MvaS7wq4QnBCA";
  const orderLink = theme
    ? toAppPath(`/buat-undangan?theme=${theme.slug}&preset_id=${theme.presetId}`)
    : toAppPath("/buat-undangan");

  const [groomName, brideName] = useMemo(() => {
    const parts = (theme?.couple || "Rizky & Sarah")
      .split("&")
      .map((part) => part.trim())
      .filter(Boolean);

    return [parts[0] || "Rizky", parts[1] || "Sarah"];
  }, [theme?.couple]);

  const galleryImages = useMemo(
    () => [
      theme?.thumbnail || theme?.image || "",
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=900&q=80",
    ],
    [theme?.image, theme?.thumbnail]
  );

  if (!theme) {
    return (
      <main className="min-h-screen bg-[#f7f1e8] text-[#5f4d2f] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#e7dccd] bg-white p-8 text-center shadow-soft">
          <h1 className="font-serif text-3xl font-bold mb-2">Preview tidak ditemukan</h1>
          <p className="text-sm text-[#8f7a57] mb-6">Preset tidak valid atau sudah tidak tersedia.</p>
          <a
            href={toAppPath("/tema")}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8e742f] text-white px-5 py-3 text-sm font-bold"
          >
            Kembali ke Galeri
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f9f2e7_0%,#f3ebdf_45%,#f6f1e8_100%)] px-3 py-5 sm:px-5 sm:py-8">
      <div className="mx-auto w-full max-w-[430px]">
        <header className="mb-4 flex items-center justify-between rounded-2xl border border-[#e7dccd] bg-white/80 backdrop-blur px-3 py-2">
          <a href={toAppPath("/tema")} className="inline-flex items-center gap-1 text-xs font-bold text-[#7c6533]">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Kembali
          </a>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f7a57]">Preview Undangan</p>
          <span className="rounded-full bg-[#f6ebd7] px-2 py-1 text-[10px] font-bold text-[#7c6533]">
            {theme.packageTier}
          </span>
        </header>

        <article className="rounded-[1.8rem] overflow-hidden border border-[#e8dfd4] shadow-soft bg-[#f7f1e8] text-[#5f4d2f]">
          <section className="relative min-h-[560px] bg-[#efe2cf] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{ backgroundImage: `url('${theme.thumbnail || theme.image}')` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-[#f7efdf]/70 to-[#f7f1e8]"></div>
            <div className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[88%] aspect-[3/4] rounded-[45%] bg-[#f2dfca]/90"></div>

            <div className="relative z-10 px-6 pt-14 pb-10 text-center min-h-[560px] flex flex-col">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8f7a55]">The Wedding Of</p>
              <h1 className="font-serif text-5xl leading-[0.95] mt-5 text-[#7a5d2a]">{theme.couple}</h1>
              <p className="mt-4 text-sm font-medium text-[#8b7750]">Sabtu, 28 Februari 2026</p>
              <div className="mt-auto space-y-4">
                <p className="font-serif italic text-2xl text-[#846130]">{theme.title}</p>
                <button
                  onClick={() => setIsOpened(true)}
                  className="w-full rounded-full bg-[#8e742f] text-white text-sm font-bold py-3 hover:bg-[#7f682b] transition-colors"
                >
                  Buka Undangan
                </button>
              </div>
            </div>
          </section>

          {isOpened ? (
            <>
              <section className="px-6 py-10 bg-[#f4ede2] text-center relative overflow-hidden">
                <div className="absolute -top-10 -left-6 w-24 h-24 rounded-full bg-[#e7dac6]/70"></div>
                <p className="text-xs font-bold tracking-[0.28em] uppercase text-[#8c7445] mb-4">QS. Ar-Rum : 21</p>
                <p className="font-serif italic text-[26px] leading-[1.45] text-[#6f5a35]">
                  Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan untukmu.
                </p>
              </section>

              <section className="px-6 py-10 bg-[#f9f5ee]">
                <h2 className="font-serif text-3xl text-center text-[#7a6132] mb-8">Mempelai</h2>
                <div className="space-y-8">
                  <article className="text-center">
                    <div className="mx-auto w-44 aspect-[4/5] rounded-t-[999px] rounded-b-2xl overflow-hidden border border-[#e6dccf] bg-white p-1.5">
                      <img
                        src={theme.thumbnail || theme.image}
                        alt={`Foto ${groomName}`}
                        className="w-full h-full object-cover rounded-t-[999px] rounded-b-xl"
                      />
                    </div>
                    <p className="font-serif text-4xl mt-4 text-[#7e6030]">{groomName}</p>
                    <p className="text-sm mt-1 text-[#8f7a57]">Putra Pertama dari Bapak Hendra & Ibu Susi</p>
                  </article>

                  <div className="text-center text-4xl font-serif text-[#8f7643]">&</div>

                  <article className="text-center">
                    <div className="mx-auto w-44 aspect-[4/5] rounded-t-[999px] rounded-b-2xl overflow-hidden border border-[#e6dccf] bg-white p-1.5">
                      <img
                        src="https://images.unsplash.com/photo-1623091410901-00e2d268901f?auto=format&fit=crop&w=700&q=80"
                        alt={`Foto ${brideName}`}
                        className="w-full h-full object-cover rounded-t-[999px] rounded-b-xl"
                      />
                    </div>
                    <p className="font-serif text-4xl mt-4 text-[#7e6030]">{brideName}</p>
                    <p className="text-sm mt-1 text-[#8f7a57]">Putri Kedua dari Bapak Budi & Ibu Rina</p>
                  </article>
                </div>
              </section>

              <section className="px-6 py-10 bg-[#f3ebdf]">
                <h2 className="font-serif text-3xl text-center text-[#7a6132] mb-7">Rangkaian Acara</h2>
                <div className="grid grid-cols-2 gap-3">
                  <article className="rounded-2xl border border-[#e6d9c5] bg-white/75 p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#8e7541]">Akad</p>
                    <p className="text-3xl font-bold text-[#5f4d2f] mt-1">10</p>
                    <p className="text-xs text-[#8d7956]">Minggu, 09.00 WIB</p>
                  </article>
                  <article className="rounded-2xl border border-[#e6d9c5] bg-white/75 p-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#8e7541]">Resepsi</p>
                    <p className="text-3xl font-bold text-[#5f4d2f] mt-1">10</p>
                    <p className="text-xs text-[#8d7956]">Minggu, 11.00 WIB</p>
                  </article>
                </div>
                <div className="mt-4 rounded-2xl border border-[#e0d4c2] bg-[#fffaf1] p-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8b754f] mb-3">Menuju Hari Bahagia</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <p className="text-2xl font-bold leading-none text-[#6c5429]">14</p>
                      <p className="text-[10px] uppercase text-[#907b56] mt-1">Hari</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold leading-none text-[#6c5429]">08</p>
                      <p className="text-[10px] uppercase text-[#907b56] mt-1">Jam</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold leading-none text-[#6c5429]">45</p>
                      <p className="text-[10px] uppercase text-[#907b56] mt-1">Menit</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold leading-none text-[#6c5429]">22</p>
                      <p className="text-[10px] uppercase text-[#907b56] mt-1">Detik</p>
                    </div>
                  </div>
                </div>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 w-full inline-flex justify-center items-center rounded-full bg-[#8e742f] text-white text-sm font-bold py-2.5 hover:bg-[#7f682b] transition-colors"
                >
                  Lihat Lokasi di Google Maps
                </a>
              </section>

              <section className="px-6 py-10 bg-[#f8f3ea]">
                <h2 className="font-serif text-3xl text-center text-[#7a6132] mb-6">Galeri Kami</h2>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden">
                    <img src={galleryImages[0]} alt="Galeri pasangan 1" className="w-full h-full object-cover" />
                  </div>
                  <div className="rounded-2xl overflow-hidden">
                    <img src={galleryImages[1]} alt="Galeri pasangan 2" className="w-full h-full object-cover" />
                  </div>
                  <div className="rounded-2xl overflow-hidden">
                    <img src={galleryImages[2]} alt="Galeri pasangan 3" className="w-full h-full object-cover" />
                  </div>
                  <div className="rounded-2xl overflow-hidden">
                    <img src={galleryImages[3]} alt="Galeri pasangan 4" className="w-full h-full object-cover" />
                  </div>
                  <div className="col-span-2 rounded-2xl overflow-hidden">
                    <img src={galleryImages[4]} alt="Galeri pasangan 5" className="w-full h-full object-cover" />
                  </div>
                </div>
              </section>

              <section className="px-6 py-10 bg-[#f3ebdf]">
                <h2 className="font-serif text-3xl text-center text-[#7a6132] mb-6">Wedding Gift</h2>
                <p className="text-sm text-center text-[#8f7a57] mb-4">
                  Doa restu Anda adalah karunia yang sangat berarti bagi kami. Namun jika memberi adalah ungkapan tanda kasih, dapat melalui:
                </p>
                <div className="space-y-3">
                  <article className="rounded-2xl border border-[#ded0ba] bg-white/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#907a56]">Bank BCA</p>
                    <p className="text-lg font-bold text-[#5f4d2f]">123 456 7890</p>
                    <p className="text-xs text-[#8f7a57]">a.n. Ikatan Cinta Wedding</p>
                  </article>
                  <article className="rounded-2xl border border-[#ded0ba] bg-white/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#907a56]">DANA / ShopeePay</p>
                    <p className="text-lg font-bold text-[#5f4d2f]">0856-7452-717</p>
                    <p className="text-xs text-[#8f7a57]">a.n. Ikatan Cinta</p>
                  </article>
                </div>
              </section>

              <section className="px-6 py-10 bg-[#f7f2e9]">
                <h2 className="font-serif text-3xl text-center text-[#7a6132] mb-6">Konfirmasi Kehadiran</h2>
                <form className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    className="w-full rounded-xl border border-[#dccfb9] bg-white px-4 py-3 text-sm placeholder:text-[#a09072] focus:outline-none focus:ring-2 focus:ring-[#a68c50]/30"
                  />
                  <select className="w-full rounded-xl border border-[#dccfb9] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#a68c50]/30">
                    <option>Jumlah Tamu</option>
                    <option>1 Orang</option>
                    <option>2 Orang</option>
                  </select>
                  <select className="w-full rounded-xl border border-[#dccfb9] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#a68c50]/30">
                    <option>Konfirmasi Kehadiran</option>
                    <option>Hadir</option>
                    <option>Tidak Hadir</option>
                  </select>
                  <textarea
                    rows={4}
                    placeholder="Ucapan & doa"
                    className="w-full rounded-xl border border-[#dccfb9] bg-white px-4 py-3 text-sm placeholder:text-[#a09072] focus:outline-none focus:ring-2 focus:ring-[#a68c50]/30"
                  ></textarea>
                  <button
                    type="button"
                    className="w-full rounded-full bg-[#8e742f] text-white font-bold text-sm py-3 hover:bg-[#7f682b] transition-colors"
                  >
                    Kirim RSVP
                  </button>
                </form>
              </section>

              <section className="px-6 py-6 text-center bg-[#efe5d8] border-t border-[#e4d7c4]">
                <p className="text-xs text-[#9a8764]">Terima kasih atas doa dan kehadirannya</p>
                <p className="mt-2 text-xs font-semibold tracking-wide text-[#7e6536]">wedding.ikatancinta.in</p>
              </section>
            </>
          ) : (
            <section className="px-6 py-5 bg-[#f7f0e5] border-t border-[#eadfce]">
              <p className="text-center text-sm text-[#8f7a57]">
                Klik <span className="font-bold">Buka Undangan</span> untuk melihat isi preview lengkap.
              </p>
            </section>
          )}
        </article>

        <a
          href={orderLink}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 inline-flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-pink-600 text-white text-sm font-bold px-5 py-3 shadow-lg shadow-primary/30"
        >
          <span className="material-symbols-outlined text-base">shopping_bag</span>
          Pakai Desain Ini
        </a>
      </div>
    </main>
  );
}
