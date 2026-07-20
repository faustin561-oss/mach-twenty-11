import SiteNav from "@/components/home/SiteNav";
import Hero from "@/components/home/Hero";
import WhatIsSection from "@/components/home/WhatIsSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import WhyChooseSection from "@/components/home/WhyChooseSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import MarketplacePreviewSection from "@/components/home/MarketplacePreview";
import StatsSection from "@/components/home/StatsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import EnterpriseSolutionsSection from "@/components/home/EnterpriseSolutionsSection";
import CarrierRecruitmentSection from "@/components/home/CarrierRecruitmentSection";
import TechnologySection from "@/components/home/TechnologySection";
import SiteFooter from "@/components/home/SiteFooter";

// Homepage — redesigned per the enterprise-grade brief. Scoped to this
// page only: no other routes, layouts, or API behavior changed. Nav is
// rendered here (not in the root layout) so /dashboard, /loadboard,
// /carrier/* etc. are untouched, matching "redesign only the homepage."
export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main className="hp-body">
        <Hero />
        <WhatIsSection />
        <CategoriesSection />
        <WhyChooseSection />
        <HowItWorksSection />
        <MarketplacePreviewSection />
        <StatsSection />
        <TestimonialsSection />
        <EnterpriseSolutionsSection />
        <CarrierRecruitmentSection />
        <TechnologySection />
        <SiteFooter />
      </main>
    </>
  );
}
