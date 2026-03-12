import Link from "next/link";
import FadeUp from "./FadeUp";
import styles from "@/app/(marketing)/marketing.module.css";

export default function Pricing() {
  return (
    <section id="pricing" className="relative z-[1] py-24 bg-cream-200 text-center">
      <div className="max-w-[1120px] mx-auto px-8">
        <div className="text-xs font-medium uppercase tracking-[1.5px] text-sage mb-3.5">
          Pricing
        </div>
        <h2 className="font-heading text-[clamp(26px,4vw,40px)] font-medium leading-[1.2] tracking-tight text-ink mb-4">
          Simple, honest pricing.
          <br />
          <em className="italic text-sage">No hidden add-ons.</em>
        </h2>
        <p className="text-base font-light text-ink-light leading-relaxed max-w-[500px] mx-auto">
          Everything included. No separate charges for AI, reminders, or
          messaging.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14 items-start">
          {/* Starter */}
          <FadeUp delay={0}>
            <div className={styles.pricingCard}>
              <div className="text-xs font-medium uppercase tracking-[1px] text-ink-lighter mb-2.5">
                Starter
              </div>
              <div className="font-heading text-2xl font-medium text-ink mb-1.5 tracking-tight">
                Essentials
              </div>
              <div className="flex items-baseline gap-1 mb-1.5">
                <span className="font-heading text-4xl font-medium text-ink tracking-tight">
                  ₹999
                </span>
                <span className="text-[13px] text-ink-lighter font-light">
                  / month
                </span>
              </div>
              <p className="text-[13px] text-ink-light font-light leading-snug mb-6 pb-5 border-b border-[rgba(44,40,37,0.1)] min-h-[44px]">
                For therapists just building their practice. Get off WhatsApp and
                Google Forms.
              </p>
              <ul className={styles.pricingFeaturesList}>
                <li className={styles.pricingFeature}>Personal booking page</li>
                <li className={styles.pricingFeature}>Up to 20 active clients</li>
                <li className={styles.pricingFeature}>UPI + Razorpay payments</li>
                <li className={styles.pricingFeature}>Auto-invoicing</li>
                <li className={styles.pricingFeature}>Session notes</li>
                <li className={styles.pricingFeature}>Automated reminders</li>
                <li className={`${styles.pricingFeature} ${styles.pricingFeatureDimmed}`}>AI note summarization</li>
                <li className={`${styles.pricingFeature} ${styles.pricingFeatureDimmed}`}>Secure messaging</li>
              </ul>
              <Link href="/signup" className={styles.btnPricingGhost}>
                Start free trial
              </Link>
            </div>
          </FadeUp>

          {/* Pro */}
          <FadeUp delay={0.08}>
            <div className={`${styles.pricingCard} ${styles.pricingCardPopular}`}>
              <div className={styles.pricingBadge}>Most popular</div>
              <div className="text-xs font-medium uppercase tracking-[1px] text-ink-lighter mb-2.5">
                Pro
              </div>
              <div className="font-heading text-2xl font-medium text-ink mb-1.5 tracking-tight">
                Full Practice
              </div>
              <div className="flex items-baseline gap-1 mb-1.5">
                <span className="font-heading text-4xl font-medium text-ink tracking-tight">
                  ₹1,999
                </span>
                <span className="text-[13px] text-ink-lighter font-light">
                  / month
                </span>
              </div>
              <p className="text-[13px] text-ink-light font-light leading-snug mb-6 pb-5 border-b border-[rgba(44,40,37,0.1)] min-h-[44px]">
                For established therapists who want AI assistance and full client
                management.
              </p>
              <ul className={styles.pricingFeaturesList}>
                <li className={styles.pricingFeature}>Everything in Starter</li>
                <li className={styles.pricingFeature}>Unlimited active clients</li>
                <li className={styles.pricingFeature}>AI session notes ✨</li>
                <li className={styles.pricingFeature}>Voice-to-text</li>
                <li className={styles.pricingFeature}>Secure client messaging</li>
                <li className={styles.pricingFeature}>Client journal</li>
                <li className={styles.pricingFeature}>Progress tracking</li>
                <li className={styles.pricingFeature}>Priority support</li>
              </ul>
              <Link href="/signup" className={styles.btnPricingPrimary}>
                Start free trial
              </Link>
            </div>
          </FadeUp>

          {/* Clinic */}
          <FadeUp delay={0.16}>
            <div className={styles.pricingCard} style={{ opacity: 0.85 }}>
              <div className={styles.pricingBadgeComing}>Coming soon</div>
              <div className="text-xs font-medium uppercase tracking-[1px] text-ink-lighter mb-2.5">
                Clinic
              </div>
              <div className="font-heading text-2xl font-medium text-ink mb-1.5 tracking-tight">
                For Teams
              </div>
              <div className="flex items-baseline gap-1 mb-1.5">
                <span className="font-heading text-4xl font-medium text-ink tracking-tight">
                  ₹4,999
                </span>
                <span className="text-[13px] text-ink-lighter font-light">
                  / month
                </span>
              </div>
              <p className="text-[13px] text-ink-light font-light leading-snug mb-6 pb-5 border-b border-[rgba(44,40,37,0.1)] min-h-[44px]">
                For therapy clinics and wellness groups with multiple
                practitioners.
              </p>
              <ul className={styles.pricingFeaturesList}>
                <li className={styles.pricingFeature}>Everything in Pro</li>
                <li className={styles.pricingFeature}>Up to 10 therapists</li>
                <li className={styles.pricingFeature}>Admin dashboard</li>
                <li className={styles.pricingFeature}>Multi-therapist scheduling</li>
                <li className={styles.pricingFeature}>Consolidated billing</li>
                <li className={styles.pricingFeature}>Custom note templates</li>
                <li className={styles.pricingFeature}>Audit logs</li>
                <li className={styles.pricingFeature}>Dedicated support</li>
              </ul>
              <span className={styles.btnPricingComing}>Notify me when ready</span>
            </div>
          </FadeUp>
        </div>

        <p className="text-center mt-7 text-[13px] text-ink-lighter font-light">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
