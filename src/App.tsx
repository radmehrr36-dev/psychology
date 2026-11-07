import { MotionConfig } from "framer-motion";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { MapSection } from "./components/MapSection";
import { TestsSection } from "./components/TestsSection";
import { StepsSection } from "./components/StepsSection";
import { CtaBanner } from "./components/CtaBanner";
import { GallerySection } from "./components/GallerySection";
import { Footer } from "./components/Footer";
import { AuthProvider } from "./lib/auth";
import { SiteDataProvider, useSiteData } from "./lib/siteData";
import {
  PublicArticleView,
  PublicArticlesPage,
  PublicBooksPage,
  PublicMagazinesPage,
  PublicPageView,
  PublicPsychologistsPage,
} from "./site/PublicContent";
import { AdminApp } from "./admin/AdminApp";

function PublicHome() {
  const { hero, cta, tests, testsSource, testsHeading, stepsHeading, testimonials, gallery, sectionOrder } = useSiteData();

  const normalizedOrder = sectionOrder.length ? sectionOrder : [
    { key: "hero" as const, enabled: true },
    { key: "cta" as const, enabled: true },
    { key: "tests" as const, enabled: true },
    { key: "map" as const, enabled: true },
    { key: "steps" as const, enabled: true },
    { key: "gallery" as const, enabled: true },
  ];

  const sections = normalizedOrder.filter((s) => s.enabled).map((s) => {
    switch (s.key) {
      case "hero":
        return <Hero key="hero" content={hero} />;
      case "cta":
        return <CtaBanner key="cta" content={cta} />;
      case "tests":
        return <TestsSection key="tests" items={tests} source={testsSource} heading={testsHeading} />;
      case "map":
        return <MapSection key="map" />;
      case "steps":
        return <StepsSection key="steps" heading={stepsHeading} />;
      case "testimonials":
        return <GallerySection key="testimonials" items={testimonials} title="شناخت بهتر خود" description="داستان‌های ساده و شخصی از رشد و تعادل." />;
      case "gallery":
        return <GallerySection key="gallery" items={gallery} title="بهتر شناخت خود، آغاز تغییر است" description="این بخش کاملاً از پنل مدیریت قابل حذف، ویرایش و افزودن است." />;
      default:
        return null;
    }
  });

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-x-clip bg-cream font-sans text-ink">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute right-[-10%] top-[30%] h-[30rem] w-[30rem] rounded-full bg-steel/[0.06] blur-3xl" />
          <div className="absolute bottom-[10%] left-[-10%] h-[26rem] w-[26rem] rounded-full bg-lav/[0.06] blur-3xl" />
        </div>
        <Header />
        <main>{sections}</main>
        <Footer />
      </div>
    </MotionConfig>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-pearl font-sans text-ink">
      <Header />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-28 md:pt-32">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SiteDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/articles" element={<PublicShell><PublicArticlesPage /></PublicShell>} />
            <Route path="/articles/:slug" element={<PublicShell><PublicArticleView /></PublicShell>} />
            <Route path="/magazines" element={<PublicShell><PublicMagazinesPage /></PublicShell>} />
            <Route path="/books" element={<PublicShell><PublicBooksPage /></PublicShell>} />
            <Route path="/psychologists" element={<PublicShell><PublicPsychologistsPage /></PublicShell>} />
            <Route path="/p/:slug" element={<PublicShell><PublicPageView /></PublicShell>} />
            <Route path="/admin/*" element={<AdminApp />} />
            <Route
              path="*"
              element={
                <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-pearl px-5 text-center">
                  <p className="text-sm font-bold text-body">صفحه یافت نشد</p>
                  <a href="/" className="rounded-full bg-ink px-5 py-2.5 text-[13px] font-bold text-white">بازگشت به خانه</a>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </SiteDataProvider>
    </AuthProvider>
  );
}
