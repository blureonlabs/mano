import Link from "next/link";
import styles from "@/app/(marketing)/marketing.module.css";

export default function CtaSection() {
  return (
    <section id="cta" className="relative z-[1] py-24 text-center">
      <div className="max-w-[960px] mx-auto px-8">
        <div className={styles.ctaBox}>
          <h2 className="font-heading text-[clamp(28px,4vw,44px)] font-medium text-white leading-[1.2] tracking-tight mb-4 relative z-[1]">
            Ready to have your practice
            <br />
            feel this calm?
          </h2>
          <p className="text-base font-light text-white/75 mb-9 relative z-[1]">
            Start your free 14-day trial. No credit card required.
          </p>
          <div className="flex flex-col items-center gap-4 relative z-[1]">
            <Link href="/signup" className={styles.ctaBtn}>
              Get Started Free &rarr;
            </Link>
            <p className="text-xs text-white/50">
              Already have an account?{" "}
              <Link href="/login" className="text-white/75 underline hover:text-white">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
