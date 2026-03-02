import { useEffect, useState } from "react";
import Features from "./components/Features";
import FaqSection from "./components/FaqSection";
import CreateInvitationFormPage from "./components/CreateInvitationFormPage";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Marquee from "./components/Marquee";
import Navbar from "./components/Navbar";
import OrderConfirmationPage from "./components/OrderConfirmationPage";
import Pricing from "./components/Pricing";
import {
  BeigeNaturalTemplate,
  BlueNatureTemplate,
  LightBlueFloralTemplate,
  NoirFloralTemplate,
  RoseGoldMinimalistTemplate,
} from "./templates/basic";
import { PremiumThemePreviewPage } from "./templates/premium";
import { ExclusiveThemePreviewPage } from "./templates/exclusive";
import InvitationPreviewPage from "./components/InvitationPreviewPage";
import ThemeDetailPage from "./components/ThemeDetailPage";
import ThemeGalleryPage from "./components/ThemeGalleryPage";
import ThemeShowcase from "./components/ThemeShowcase";
import TestimonialsSection from "./components/TestimonialsSection";
import WhatsAppButton from "./components/WhatsAppButton";
import { getCurrentPathname } from "./utils/navigation";

function HomePage() {
  return (
    <main id="top">
      <Navbar />
      <Hero />
      <Marquee />
      <HowItWorks />
      <Features />
      <ThemeShowcase />
      <TestimonialsSection />
      <Pricing />
      <FaqSection />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}

function App() {
  const [pathname, setPathname] = useState(getCurrentPathname());
  const [routeVersion, setRouteVersion] = useState(0);

  useEffect(() => {
    const syncPath = () => {
      setPathname(getCurrentPathname());
      setRouteVersion((prev) => prev + 1);
    };
    window.addEventListener("popstate", syncPath);
    window.addEventListener("app:navigate", syncPath);
    return () => {
      window.removeEventListener("popstate", syncPath);
      window.removeEventListener("app:navigate", syncPath);
    };
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll(".animate-enter-up"));
    if (elements.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    elements.forEach((element) => {
      if (!element.classList.contains("is-visible")) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [pathname, routeVersion]);

  if (pathname === "/tema") {
    return <ThemeGalleryPage />;
  }

  if (pathname === "/buat-undangan") {
    return <CreateInvitationFormPage />;
  }

  if (pathname === "/konfirmasi-order") {
    return <OrderConfirmationPage />;
  }

  if (pathname === "/preview-undangan" || pathname === "/preset&design") {
    return <InvitationPreviewPage />;
  }


  if (pathname === "/undangan/light-blue-floral") {
    return <LightBlueFloralTemplate />;
  }

  if (pathname === "/undangan/rose-gold-minimalist") {
    return <RoseGoldMinimalistTemplate />;
  }

  if (pathname === "/undangan/beige-natural") {
    return <BeigeNaturalTemplate />;
  }

  if (pathname === "/undangan/blue-nature") {
    return <BlueNatureTemplate />;
  }

  if (pathname === "/undangan/noir-floral") {
    return <NoirFloralTemplate />;
  }

  if (pathname === "/preview-undangan-premium") {
    return <PremiumThemePreviewPage />;
  }

  if (pathname === "/preview-undangan-eksklusif" || pathname === "/preview-undangan-exclusive") {
    return <ExclusiveThemePreviewPage />;
  }

  if (pathname.startsWith("/tema/")) {
    return <ThemeDetailPage />;
  }

  return <HomePage />;
}

export default App;
