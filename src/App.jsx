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
import PublishedInvitationPage from "./components/PublishedInvitationPage";
import Pricing from "./components/Pricing";
import {
  IvoryGraceTemplate,
  NavyBlossomTemplate,
  NoirMinimalistTemplate,
} from "./templates/basic";
import {
  BlueNatureTemplate,
  PremiumThemePreviewPage,
  TimelessPromiseTemplate,
  MistyRomanceTemplate,
  VelvetBurgundyTemplate,
} from "./templates/premium";
import {
  BotanicalEleganceTemplate,
  EternalSummitTemplate,
  ExclusiveThemePreviewPage,
  PuspaAsmaraTemplate,
} from "./templates/exclusive";
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

    const registerAnimatedElements = (root = document) => {
      const elements = Array.from(root.querySelectorAll(".animate-enter-up"));
      elements.forEach((element) => {
        if (!element.classList.contains("is-visible")) {
          observer.observe(element);
        }
      });
    };

    registerAnimatedElements();

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) {
            return;
          }

          if (node.classList.contains("animate-enter-up") && !node.classList.contains("is-visible")) {
            observer.observe(node);
          }

          registerAnimatedElements(node);
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname, routeVersion]);

  if (pathname === "/tema") {
    return <ThemeGalleryPage />;
  }

  if (pathname === "/buat-undangan") {
    return <CreateInvitationFormPage />;
  }

  if (pathname.startsWith("/konfirmasi-order/")) {
    return <OrderConfirmationPage />;
  }

  if (pathname === "/preview-undangan" || pathname === "/preset&design") {
    return <InvitationPreviewPage />;
  }


  if (pathname === "/undangan/blue-nature") {
    return <BlueNatureTemplate />;
  }

  if (pathname === "/undangan/noir-minimalist") {
    return <NoirMinimalistTemplate mode="demo" />;
  }

  if (pathname === "/undangan/ivory-grace") {
    return <IvoryGraceTemplate mode="demo" />;
  }

  if (pathname === "/undangan/navy-blossom") {
    return <NavyBlossomTemplate mode="demo" />;
  }

  if (pathname === "/undangan/timeless-promise") {
    return <TimelessPromiseTemplate />;
  }

  if (pathname === "/undangan/misty-romance") {
    return <MistyRomanceTemplate />;
  }

  if (pathname === "/undangan/velvet-burgundy") {
    return <VelvetBurgundyTemplate />;
  }

  if (pathname === "/undangan/botanical-elegance") {
    return <BotanicalEleganceTemplate />;
  }

  if (pathname === "/undangan/puspa-asmara") {
    return <PuspaAsmaraTemplate />;
  }

  if (pathname === "/undangan/eternal-summit") {
    return <EternalSummitTemplate />;
  }

  if (pathname.startsWith("/undangan/")) {
    return <PublishedInvitationPage />;
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
