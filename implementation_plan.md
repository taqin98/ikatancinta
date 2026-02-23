# React + Vite + Tailwind CSS Landing Page for ikatancinta.in

Create a pixel-perfect React port of the provided HTML landing page for the ikatancinta.in wedding invitation platform.

## Proposed Changes

### Project Scaffolding

#### [NEW] Vite + React project
- Initialize with `npx -y create-vite@latest ./ -- --template react`
- Install Tailwind CSS v3 + dependencies: `npm install -D tailwindcss @tailwindcss/forms postcss autoprefixer`
- Install Google Material Symbols Icons package: `npm install material-symbols`

---

### Tailwind Configuration

#### [NEW] [tailwind.config.js](file:///Applications/XAMPP/xamppfiles/htdocs/ikatancinta/tailwind.config.js)
Custom theme matching the HTML reference:
- **Colors**: `primary (#ee2b8c)`, `primary-soft`, `secondary (sage green)`, `secondary-soft`, `accent (dusty rose)`, `accent-soft`, `background-light`, `background-dark`, `surface`
- **Fonts**: `display (Plus Jakarta Sans)`, `serif (Playfair Display)`
- **Border-radius**: Custom defaults (1rem, 1.5rem, 2rem, 2.5rem)
- **Box shadows**: `glass`, `soft`, `glow`
- Dark mode via `class` strategy

#### [NEW] [postcss.config.js](file:///Applications/XAMPP/xamppfiles/htdocs/ikatancinta/postcss.config.js)
Standard PostCSS config with Tailwind and Autoprefixer

---

### Styles

#### [MODIFY] [index.css](file:///Applications/XAMPP/xamppfiles/htdocs/ikatancinta/src/index.css)
- Tailwind directives (`@tailwind base/components/utilities`)
- Google Fonts import (Plus Jakarta Sans, Playfair Display, Material Symbols Outlined)
- Custom CSS classes: `.glass-nav`, `.text-gradient`, `.no-scrollbar`, marquee keyframes

---

### React Components

All components go in `src/components/`:

#### [NEW] [Navbar.jsx](file:///Applications/XAMPP/xamppfiles/htdocs/ikatancinta/src/components/Navbar.jsx)
- Fixed glass-morphism navbar with logo, desktop menu, CTA buttons

#### [NEW] [Hero.jsx](file:///Applications/XAMPP/xamppfiles/htdocs/ikatancinta/src/components/Hero.jsx)
- Hero section with headline, CTA buttons, social proof avatars, stacked invitation card visuals with floating RSVP badge

#### [NEW] [Marquee.jsx](file:///Applications/XAMPP/xamppfiles/htdocs/ikatancinta/src/components/Marquee.jsx)
- Angled dark marquee strip with infinite scrolling text

#### [NEW] [Features.jsx](file:///Applications/XAMPP/xamppfiles/htdocs/ikatancinta/src/components/Features.jsx)
- Bento grid with Photo Gallery (large), Music Player (tall), Map Navigation, Digital Envelope, and RSVP cards

#### [NEW] [Pricing.jsx](file:///Applications/XAMPP/xamppfiles/htdocs/ikatancinta/src/components/Pricing.jsx)
- Three pricing tiers: Hemat (99k), Premium (149k, highlighted), Exclusive (299k)

#### [NEW] [Footer.jsx](file:///Applications/XAMPP/xamppfiles/htdocs/ikatancinta/src/components/Footer.jsx)
- Logo, copyright, social media links (Instagram, Twitter)

#### [NEW] [WhatsAppButton.jsx](file:///Applications/XAMPP/xamppfiles/htdocs/ikatancinta/src/components/WhatsAppButton.jsx)
- Floating bottom-right WhatsApp button with ping animation and hover tooltip

---

### App Assembly

#### [MODIFY] [App.jsx](file:///Applications/XAMPP/xamppfiles/htdocs/ikatancinta/src/App.jsx)
Compose all sections in order: `Navbar → Hero → Marquee → Features → Pricing → Footer → WhatsAppButton`

#### [MODIFY] [index.html](file:///Applications/XAMPP/xamppfiles/htdocs/ikatancinta/index.html)
Set proper lang, title, and meta tags

---

## Verification Plan

### Automated Tests
- `npm run dev` — confirm dev server starts without errors on `http://localhost:5173`
- `npm run build` — confirm production build completes without errors

### Browser Verification
- Open `http://localhost:5173` in the browser tool
- Visually verify that all sections (Navbar, Hero, Marquee, Features, Pricing, Footer, WhatsApp button) render and match the reference HTML

---

## Execution Status (2026-02-20)

- Completed implementation for all planned components:
  - `src/components/Navbar.jsx`
  - `src/components/Hero.jsx`
  - `src/components/Marquee.jsx`
  - `src/components/Features.jsx`
  - `src/components/Pricing.jsx`
  - `src/components/Footer.jsx`
  - `src/components/WhatsAppButton.jsx`
- Completed app composition in `src/App.jsx`
- Verification completed:
  - `npm run build` passed
  - `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort` starts successfully (manually stopped after startup check)
- Post-implementation improvements completed:
  - Replaced default favicon with `public/favicon.svg` and updated `index.html`
  - Added smooth anchor navigation in navbar (`#tema`, `#fitur`, `#harga`, `#testimoni`)
  - Added section IDs + `scroll-mt-24` for fixed-header offset
  - Enabled global smooth scrolling in `src/index.css`
  - Re-verified with `npm run lint` and `npm run build` (both passed)
- Tema page completed:
  - Added `src/components/ThemeGalleryPage.jsx` based on provided mobile gallery design
  - Added lightweight pathname-based page switch in `src/App.jsx` (`/` and `/tema`)
  - Updated navbar `Tema` item to navigate to `/tema`
  - Re-verified with `npm run lint` and `npm run build` (both passed)
- Tema page enhancements completed:
  - Added interactive category state and filtering logic (`Semua`, `Modern`, `Minimalis`, `Islami`, `Floral`, `Rustic`)
  - Tagged each template with a category and render filtered results only
  - Improved responsive layout:
    - Mobile keeps card/app-like layout
    - Tablet/desktop expands to wider responsive grid and hides mobile bottom nav
  - Added dynamic template count badge in header
  - Re-verified with `npm run lint` and `npm run build` (both passed)
- Tema page redesign completed:
  - Rebuilt `/tema` following latest catalog design (hero filter chips + phone-mockup product cards)
  - Added custom `phone-mockup-shadow` utility in `src/index.css`
  - Kept filter kategori fully interactive on the new layout
  - Updated `/tema` route rendering in `src/App.jsx` to avoid duplicate shared wrappers
  - Re-verified with `npm run lint` and `npm run build` (both passed)
