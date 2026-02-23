const items = [
    'Modern Aesthetic',
    'Fast & Easy',
    'Share via WhatsApp',
    'Music Player',
    'Live Maps',
    'Digital Envelope',
];

export default function Marquee() {
    // Duplicate items to create seamless loop
    const allItems = [...items, ...items];

    return (
        <div id="social-proof" className="bg-slate-900 py-4 sm:py-6 overflow-hidden transform -rotate-1 origin-left w-[105%] -ml-2 mb-12 sm:mb-16 scroll-mt-24">
            <div className="flex gap-6 sm:gap-8 items-center animate-marquee whitespace-nowrap text-white/50 font-serif text-lg sm:text-2xl italic">
                {allItems.map((item, i) => (
                    <span key={i}>
                        {i > 0 && <span className="mx-3 sm:mx-4">•</span>}
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}
