import Navbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import HowItWorks from "@/components/marketing/HowItWorks";
import Problem from "@/components/marketing/Problem";
import Features from "@/components/marketing/Features";
import BookingPreview from "@/components/marketing/BookingPreview";
import Privacy from "@/components/marketing/Privacy";
import Pricing from "@/components/marketing/Pricing";
import Testimonials from "@/components/marketing/Testimonials";
import FAQ from "@/components/marketing/FAQ";
import BlogTeaser from "@/components/marketing/BlogTeaser";
import CtaSection from "@/components/marketing/CtaSection";
import Footer from "@/components/marketing/Footer";
import styles from "./marketing.module.css";

export default function HomePage() {
  return (
    <div className={styles.texture}>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Problem />
      <Features />
      <BookingPreview />
      <Privacy />
      <Pricing />
      <Testimonials />
      <FAQ />
      <BlogTeaser />
      <CtaSection />
      <Footer />
    </div>
  );
}
