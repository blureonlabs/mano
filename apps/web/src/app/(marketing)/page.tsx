import Navbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import Problem from "@/components/marketing/Problem";
import Features from "@/components/marketing/Features";
import Privacy from "@/components/marketing/Privacy";
import Pricing from "@/components/marketing/Pricing";
import Testimonials from "@/components/marketing/Testimonials";
import CtaSection from "@/components/marketing/CtaSection";
import Footer from "@/components/marketing/Footer";
import styles from "./marketing.module.css";

export default function HomePage() {
  return (
    <div className={styles.texture}>
      <Navbar />
      <Hero />
      <Problem />
      <Features />
      <Privacy />
      <Pricing />
      <Testimonials />
      <CtaSection />
      <Footer />
    </div>
  );
}
