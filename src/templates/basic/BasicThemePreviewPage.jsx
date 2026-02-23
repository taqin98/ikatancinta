import { useMemo } from "react";
import { getThemeByPresetId } from "../../data/themes";

function getPresetIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("preset_id") || "";
}

export default function BasicThemePreviewPage() {
  const presetId = getPresetIdFromUrl();
  const theme = getThemeByPresetId(presetId);

  const [brideFirstName, groomFirstName] = useMemo(() => {
    const parts = (theme?.couple || "Adinda & John")
      .split("&")
      .map((part) => part.trim())
      .filter(Boolean);
    return [parts[0] || "Adinda", parts[1] || "John"];
  }, [theme?.couple]);

  if (!theme) {
    return (
      <main className="min-h-screen bg-[#f9f6f0] px-4 py-10">
        <div className="mx-auto max-w-md rounded-3xl bg-white/90 border border-[#e9dfd0] p-7 text-center shadow-soft">
          <h1 className="font-serif text-3xl font-bold text-[#6b6e2e] mb-2">Preview tidak ditemukan</h1>
          <p className="text-sm text-slate-600 mb-5">Preset tidak valid atau sudah tidak tersedia.</p>
          <a
            href="/tema"
            className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white bg-[#6b6e2e]"
          >
            Kembali ke Galeri
          </a>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#f9f6f0] bg-cover bg-center px-3 py-4"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.84) 0%, rgba(249,246,240,0.96) 100%), url('https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80')",
      }}
    >
      <div className="mx-auto w-full max-w-[480px] rounded-[2rem] border border-[#e8dfcf] bg-white/65 backdrop-blur-md shadow-soft pb-24 overflow-hidden relative">
        <section className="w-full">
          <img
            src={theme.image || theme.thumbnail}
            alt={`Cover ${theme.name}`}
            className="w-full h-[500px] object-cover rounded-b-3xl shadow-md"
          />
        </section>

        <section className="px-6 py-12 text-center">
          <p className="font-serif italic text-4xl text-[#6b6e2e] mb-4">Allah&apos;s blessings message</p>
          <p className="italic text-sm leading-relaxed mb-2 font-medium text-[#594d3d]">
            &quot;Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari
            jenismu sendiri, agar kamu merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih
            dan sayang.&quot;
          </p>
          <p className="text-xs text-slate-500 font-semibold">(QS. Ar-Rum: 21)</p>
        </section>

        <section id="couple" className="px-6 py-8 text-center">
          <h2 className="font-serif italic text-5xl text-[#6b6e2e] mb-10">The Wedding Of</h2>

          <div className="mb-10 flex flex-col items-center">
            <div
              className="w-48 h-48 rounded-full bg-cover bg-center border-4 border-white shadow-lg mb-4"
              style={{
                backgroundImage: `url('${theme.thumbnail || theme.image}')`,
              }}
            ></div>
            <p className="text-sm mb-1 text-[#6b6e2e] inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-base">photo_camera</span> {brideFirstName.toLowerCase()}
            </p>
            <h3 className="font-semibold text-2xl text-[#6b6e2e] mb-2">{brideFirstName} Mawaria</h3>
            <p className="text-sm">Youngest Daughter of</p>
            <p className="text-sm mb-2">Bapak Sanusi S.M & Ibu Jubaedah</p>
            <p className="text-sm text-slate-500">dari London Utara</p>
          </div>

          <div className="font-serif text-6xl text-[#6b6e2e] mb-10 border border-[#6b6e2e] rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            &
          </div>

          <div className="mb-10 flex flex-col items-center">
            <div
              className="w-48 h-48 rounded-full bg-cover bg-center border-4 border-white shadow-lg mb-4"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80')",
              }}
            ></div>
            <p className="text-sm mb-1 text-[#6b6e2e] inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-base">photo_camera</span> {groomFirstName.toLowerCase()}_doe
            </p>
            <h3 className="font-semibold text-2xl text-[#6b6e2e] mb-2">{groomFirstName} Doe S.Kom</h3>
            <p className="text-sm">First Son of</p>
            <p className="text-sm mb-2">Bapak Akbar S.Kom & Ibu Siti Maimunah</p>
            <p className="text-sm text-slate-500">dari Jakarta, Indonesia</p>
          </div>
        </section>

        <section id="story" className="px-6 py-8">
          <h2 className="font-serif italic text-5xl text-[#6b6e2e] text-center mb-8">Our Love Story</h2>
          <div className="bg-white/70 rounded-2xl shadow-md overflow-hidden p-4">
            <img
              src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=900&q=80"
              className="w-full h-48 object-cover rounded-xl mb-4"
              alt="Hands"
            />
            <h3 className="font-bold text-xl text-center mb-2">Our Wedding</h3>
            <p className="text-xs text-center text-slate-600 mb-2">
              Berawal dari pertemanan sederhana, bertumbuh menjadi perjalanan cinta yang saling menguatkan.
            </p>
            <p className="text-right text-xs text-slate-400">4/4</p>
          </div>
        </section>

        <section id="gallery" className="px-6 py-12 text-center">
          <h2 className="font-serif italic text-4xl text-[#6b6e2e] mb-6">Precious moment</h2>
          <p className="text-sm mb-6">&quot;Creating memories is a priceless gift. Memories last a lifetime.&quot;</p>
          <p className="text-xs text-slate-500 mb-8">*title and words can be edited in the gallery menu</p>
          <div className="border-2 border-[#6b6e2e] bg-white/50 p-6 rounded-xl text-sm font-medium text-[#6b6e2e]">
            Anda Belum Mengupload gallery, silahkan upload moment terbaikmu di <span className="font-bold">Gallery Section.</span>
          </div>
        </section>

        <section id="event" className="px-6 py-12 text-center">
          <h2 className="font-serif italic text-5xl text-[#6b6e2e] mb-8">Save the Date</h2>
          <div className="flex justify-center gap-4 mb-6">
            <div className="text-center"><span className="block text-3xl font-bold text-[#6b6e2e]">06</span><span className="text-xs uppercase">Days</span></div>
            <div className="text-center"><span className="block text-3xl font-bold text-[#6b6e2e]">10</span><span className="text-xs uppercase">Hours</span></div>
            <div className="text-center"><span className="block text-3xl font-bold text-[#6b6e2e]">37</span><span className="text-xs uppercase">Minutes</span></div>
            <div className="text-center"><span className="block text-3xl font-bold text-[#6b6e2e]">33</span><span className="text-xs uppercase">Seconds</span></div>
          </div>

          <p className="text-sm mb-6">Saturday, February 28th, 2026</p>
          <div className="flex flex-col gap-3 items-center mb-8">
            <button className="bg-[#5c5035] text-white px-6 py-2 rounded-full text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">calendar_add_on</span> save event to calendar
            </button>
            <button className="bg-[#5c5035] text-white px-6 py-2 rounded-full text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">notifications_active</span> turn on notifications
            </button>
          </div>

          <p className="text-sm mb-6"><span className="font-bold">319 guest</span> response will join, let&apos;s send your response too.</p>
          <button className="w-full bg-[#5c5035] text-white font-bold py-3 rounded text-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">fact_check</span> RESERVATION (RSVP)
          </button>
        </section>

        <section id="location" className="px-6 py-8 space-y-8">
          <div className="bg-white/80 rounded-2xl p-6 shadow-sm text-center">
            <div className="bg-slate-200 h-40 rounded-xl mb-4 flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-4xl">map</span>
            </div>
            <p className="text-sm mb-4">Plataran Menteng, Jalan HOS. Cokroaminoto, Gondangdia, Kota Jakarta Pusat.</p>
            <button className="bg-[#5c5035] text-white px-6 py-2 rounded-full text-xs">see location</button>
          </div>

          <div className="bg-white/80 rounded-2xl p-6 shadow-sm text-center">
            <h2 className="font-serif italic text-4xl text-[#6b6e2e] mb-4">Marriage Contract</h2>
            <p className="text-sm font-medium">Friday, April 28th, 2026</p>
            <p className="text-sm mb-2 inline-flex items-center gap-1"><span className="material-symbols-outlined text-base text-[#6b6e2e]">schedule</span> at 09:00 WIB - finish</p>
            <p className="text-sm mb-4 inline-flex items-center gap-1"><span className="material-symbols-outlined text-base text-[#6b6e2e]">location_on</span> Masjid Al - Barkah, Bekasi Selatan</p>
            <button className="bg-[#5c5035] text-white px-6 py-2 rounded-full text-xs">see location</button>
          </div>

          <div className="bg-white/80 rounded-2xl p-6 shadow-sm text-center">
            <h2 className="font-serif italic text-4xl text-[#6b6e2e] mb-4">Reception</h2>
            <p className="text-sm font-medium">Friday, March 15th, 2026</p>
            <p className="text-sm mb-2 inline-flex items-center gap-1"><span className="material-symbols-outlined text-base text-[#6b6e2e]">schedule</span> at 15:00 WIB - finish</p>
            <p className="text-sm mb-4 inline-flex items-center gap-1"><span className="material-symbols-outlined text-base text-[#6b6e2e]">location_on</span> DoubleTree by Hilton Jakarta</p>
            <button className="bg-[#5c5035] text-white px-6 py-2 rounded-full text-xs">see location</button>
          </div>
        </section>

        <section id="wishes" className="px-6 py-12">
          <h2 className="font-serif italic text-5xl text-[#6b6e2e] text-center mb-8">Wishes</h2>
          <div className="space-y-4 mb-8 h-64 overflow-y-auto">
            <div className="flex gap-3 bg-white/80 p-4 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-teal-400 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">D</div>
              <div>
                <p className="font-bold text-sm">Dee</p>
                <p className="text-xs text-slate-500 mb-1">at Bogor</p>
                <p className="text-sm">&quot;Beautiful&quot;</p>
              </div>
            </div>
            <div className="flex gap-3 bg-white/80 p-4 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">OW</div>
              <div>
                <p className="font-bold text-sm">Our Wedding Link</p>
                <p className="text-xs text-slate-500 mb-1">at Bekasi</p>
                <p className="text-sm">&quot;Beautiful design matters. Happy for all of you&quot;</p>
              </div>
            </div>
          </div>

          <div className="bg-white/50 p-6 rounded-xl">
            <p className="mb-4 font-semibold text-[#6b6e2e]">Send a wish:</p>
            <input type="text" placeholder="Your full name" className="w-full mb-3 p-3 rounded bg-white/70 border border-slate-200 text-sm focus:outline-none" />
            <input type="text" placeholder="Your address" className="w-full mb-3 p-3 rounded bg-white/70 border border-slate-200 text-sm focus:outline-none" />
            <textarea placeholder="ex: congrats for this event" rows="3" className="w-full mb-3 p-3 rounded bg-white/70 border border-slate-200 text-sm focus:outline-none"></textarea>
            <button className="w-full bg-[#6b6e2e] text-white py-3 rounded text-sm font-semibold hover:bg-[#5c5035] transition">submit now</button>
          </div>
        </section>

        <footer className="text-center pb-20 pt-8">
          <p className="text-xs text-slate-500">powered by</p>
          <p className="font-bold text-sm tracking-widest mb-2">IKATANCINTA.IN</p>
          <div className="flex justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-pink-500"><span className="material-symbols-outlined text-sm">favorite</span></div>
            <div className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-pink-600"><span className="material-symbols-outlined text-sm">photo_camera</span></div>
          </div>
        </footer>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[85%] max-w-[400px] bg-[#fdfaf5] border border-slate-200 rounded-full shadow-lg flex justify-between items-center px-6 py-3 z-50">
          <a href="#couple" className="text-[#6b6e2e] hover:text-[#5c5035]"><span className="material-symbols-outlined text-lg">favorite</span></a>
          <a href="#gallery" className="text-slate-400 hover:text-[#6b6e2e]"><span className="material-symbols-outlined text-lg">imagesmode</span></a>
          <a href="#event" className="text-slate-400 hover:text-[#6b6e2e]"><span className="material-symbols-outlined text-lg">calendar_month</span></a>
          <a href="#location" className="text-slate-400 hover:text-[#6b6e2e]"><span className="material-symbols-outlined text-lg">map</span></a>
          <a href="#wishes" className="bg-[#6b6e2e] text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">edit</span> Wishes
          </a>
        </nav>

        <a
          href={`https://wa.me/628567452717?text=${encodeURIComponent(`Halo Admin, saya mau pakai desain BASIC ${theme.name} (${theme.presetId}).`)}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-24 right-4 bg-[#6b6e2e] text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center z-50"
        >
          <span className="material-symbols-outlined text-base">chat</span>
        </a>
      </div>
    </main>
  );
}
