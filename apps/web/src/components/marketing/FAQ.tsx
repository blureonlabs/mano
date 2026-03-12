"use client";

import { useState } from "react";
import FadeUp from "./FadeUp";
import styles from "@/app/(marketing)/marketing.module.css";

const faqs = [
  {
    q: "Is my data stored in India?",
    a: "Yes. All data is hosted on Supabase servers in Mumbai (ap-south-1 region), ensuring full compliance with the Digital Personal Data Protection (DPDP) Act 2023. Your client data never leaves India.",
  },
  {
    q: "Can clients see my session notes?",
    a: "No. Session notes are strictly therapist-only. Clients have zero access to your notes, diagnoses, or clinical observations. What you write stays private.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Mano is fully web-based and works on any device with a browser \u2014 desktop, tablet, or phone. No downloads, no apps to manage.",
  },
  {
    q: "Can I use my own Zoom account?",
    a: "Yes. Connect your Zoom account via OAuth in settings. Mano auto-generates meeting links for each session. You can also use Google Meet or any other platform \u2014 just paste the link.",
  },
  {
    q: "What payment methods are supported?",
    a: "UPI, Razorpay (cards, net banking, wallets), and manual payment tracking. GST-compliant invoices are generated automatically for every transaction.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. We offer a 14-day free trial on all plans. No credit card required to start. Cancel anytime.",
  },
  {
    q: "Can I import existing clients?",
    a: "Yes. You can add clients manually one-by-one, or bulk import via CSV upload (coming soon). All client records are structured and searchable from day one.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <section className="relative z-[1] py-24">
      <div className="max-w-[1120px] mx-auto px-8">
        <FadeUp>
          <div className="text-center mb-14">
            <div className="text-xs font-medium uppercase tracking-[1.5px] text-sage mb-3.5">
              Questions
            </div>
            <h2 className="font-heading text-[clamp(26px,4vw,40px)] font-medium leading-[1.2] tracking-tight text-ink">
              Frequently asked
            </h2>
          </div>
        </FadeUp>

        <div className={styles.faqAccordion}>
          {faqs.map((faq, i) => (
            <FadeUp key={i} delay={i * 0.05}>
              <div className={styles.faqItem}>
                <button
                  className={styles.faqQuestion}
                  onClick={() => toggle(i)}
                  aria-expanded={openIndex === i}
                >
                  <span>{faq.q}</span>
                  <span className={`${styles.faqIcon} ${openIndex === i ? styles.faqIconExpanded : ""}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </span>
                </button>
                <div className={`${styles.faqAnswer} ${openIndex === i ? styles.faqAnswerExpanded : ""}`}>
                  <p className={styles.faqAnswerText}>{faq.a}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
