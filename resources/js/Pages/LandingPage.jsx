import React, { useRef } from "react";
import Header from "../components/layouts/header";
import Footer from "../components/layouts/footer";
import HeroSection from "./LandingPage/HeroSection";

export default function LandingPage() {
  const heroRef = useRef(null);

  const scrollTo = (ref) => {
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSignInClick = () => {
    scrollTo(heroRef);
  };

  return (
    <>
      <Header onSignInClick={handleSignInClick} />

      {/* HERO */}
      <section ref={heroRef}>
        <HeroSection />
      </section>

      <Footer />
    </>
  );
}
