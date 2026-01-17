import React, { useRef, useState, useEffect } from "react";
import Header from "../components/layouts/Header";
import Footer from "../components/layouts/Footer";

import HeroSection from "./LandingPage/HeroSection";
import CategoriesSection from "./LandingPage/CategoriesSection";
import FeaturedProductsSection from "./LandingPage/FeaturedProductsSection";
import ServicesSection from "./LandingPage/ServicesSection";
import AboutSection from "./LandingPage/AboutSection";
import ContactSection from "./LandingPage/ContactSection";

export default function LandingPage() {
  const heroRef = useRef(null);
  const productsRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

const [activeKey, setActiveKey] = useState(null);
const [lockKey, setLockKey] = useState(null);


const scrollTo = (ref, key) => {
  if (!ref?.current) return;

  setLockKey(key);
  setActiveKey(key);

  ref.current.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  window.clearTimeout(scrollTo._t);
  scrollTo._t = window.setTimeout(() => {
    setLockKey(null);
  }, 900);
};

useEffect(() => {
  const entriesMap = new Map();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entriesMap.set(entry.target, entry);
      });

      if (lockKey) return;

      const visible = Array.from(entriesMap.values())
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      const key = visible.target.dataset.spy;
      if (key) setActiveKey(key);
    },
    {
      threshold: [0.25, 0.4, 0.6],
      rootMargin: "-20% 0px -60% 0px",
    }
  );

  [heroRef, productsRef, aboutRef, contactRef]
    .map((r) => r.current)
    .filter(Boolean)
    .forEach((el) => observer.observe(el));

  return () => observer.disconnect();
}, [lockKey]);

return (
  <>
<Header
  activeKey={activeKey}
  onHome={() => scrollTo(heroRef, "home")}
  onProducts={() => scrollTo(productsRef, "products")}
  onAbout={() => scrollTo(aboutRef, "about")}
  onContact={() => scrollTo(contactRef, "contact")}
/>


    <section ref={heroRef} data-spy="home">
      <HeroSection
        onScrollTo={(key) => {
          if (key === "products") scrollTo(productsRef);
          if (key === "contact") scrollTo(contactRef);
        }}
      />
    </section>

    <section ref={productsRef} data-spy="products" id="products">
      <CategoriesSection />
      <FeaturedProductsSection />
      <ServicesSection />
    </section>

    <section ref={aboutRef} data-spy="about" id="about">
      <AboutSection />
    </section>

    <section ref={contactRef} data-spy="contact" id="contact">
      <ContactSection />
    </section>

    <Footer />
  </>
);

}
