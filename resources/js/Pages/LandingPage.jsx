import React, { useRef } from "react";
import Header from "../components/layouts/header";
import Footer from "../components/layouts/footer";

import SectionShell from "../components/ui/SectionShell";
import HeroSection from "../components/ui/HeroSection";
import CategoriesSection from "../components/ui/CategoriesSection";
import FeaturedProductsSection from "../components/ui/FeaturedProductsSection";
import ServicesSection from "../components/ui/ServicesSection";
import AboutSection from "../components/ui/AboutSection";
import ContactSection from "../components/ui/ContactSection";

export default function LandingPage() {
  const sectionRefs = {
    hero: useRef(null),
    categories: useRef(null),
    products: useRef(null),
    services: useRef(null),
    about: useRef(null),
    contact: useRef(null),
  };

  const scrollTo = (key) => {
    const ref = sectionRefs[key];
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <Header />

      <div ref={sectionRefs.hero}>
        <SectionShell id="home" variant="hero">
          <HeroSection onScrollTo={scrollTo} />
        </SectionShell>
      </div>

      <div ref={sectionRefs.categories}>
        <SectionShell id="categories" variant="categories">
          <CategoriesSection onScrollTo={scrollTo} />
        </SectionShell>
      </div>

      <div ref={sectionRefs.products}>
        <SectionShell id="products" variant="products">
          <FeaturedProductsSection onScrollTo={scrollTo} />
        </SectionShell>
      </div>

      <div ref={sectionRefs.services}>
        <SectionShell id="services" variant="services">
          <ServicesSection />
        </SectionShell>
      </div>

      <div ref={sectionRefs.about}>
        <SectionShell id="about" variant="about">
          <AboutSection />
        </SectionShell>
      </div>

      <div ref={sectionRefs.contact}>
        <SectionShell id="contact" variant="contact">
          <ContactSection />
        </SectionShell>
      </div>

      <Footer onSignInClick={() => scrollTo("hero")} />
    </div>
  );
}
