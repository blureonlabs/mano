import FadeUp from "./FadeUp";
import styles from "@/app/(marketing)/marketing.module.css";

const principles = [
  {
    title: "Your data never trains our AI",
    desc: "Session notes and client data are never used to train models. Ever. Unlike some tools.",
  },
  {
    title: "India-hosted servers",
    desc: "All data stored in India, meeting DPDP Act 2023 requirements. No overseas data transfer.",
  },
  {
    title: "You own everything",
    desc: "Export all your data anytime. Delete a client record instantly and completely.",
  },
  {
    title: "Audio deleted immediately",
    desc: "If you use voice-to-text, audio is transcribed and deleted within seconds. Never stored.",
  },
];

const comparisons = [
  { label: "Data stored in India", badge: "✓ Yes", type: "yes" as const },
  { label: "Notes train AI models", badge: "✗ Never", type: "no" as const },
  { label: "Audio permanently deleted", badge: "✓ Yes", type: "yes" as const },
  { label: "Client data on WhatsApp", badge: "✗ Never", type: "no" as const },
  { label: "You own your data", badge: "100% Yours", type: "yours" as const },
  { label: "DPDP Act compliant", badge: "✓ Yes", type: "yes" as const },
];

const badgeClass = {
  yes: styles.badgeYes,
  no: styles.badgeNo,
  yours: styles.badgeYours,
};

export default function Privacy() {
  return (
    <section id="privacy" className="relative z-[1] py-24">
      <div className="max-w-[960px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs font-medium uppercase tracking-[1.5px] text-sage mb-3.5">
              Privacy first
            </div>
            <h2 className="font-heading text-[clamp(26px,4vw,40px)] font-medium leading-[1.2] tracking-tight text-ink mb-4">
              Your clients trust you.
              <br />
              <em className="italic text-sage">Trust your tools.</em>
            </h2>
            <p className="text-base font-light text-ink-light leading-relaxed max-w-[500px]">
              Mental health data is the most sensitive data that exists. We built
              Mano with that weight in mind.
            </p>

            <div className="flex flex-col gap-5 mt-8">
              {principles.map((p) => (
                <div key={p.title} className="flex gap-3.5 items-start">
                  <div className={styles.privacyCheck}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-sage"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <strong className="block text-[15px] font-medium text-ink mb-0.5">
                      {p.title}
                    </strong>
                    <span className="text-[13px] font-light text-ink-light leading-relaxed">
                      {p.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <FadeUp>
            <div className={styles.privacyVisual}>
              <div className="font-heading text-[15px] font-medium text-ink mb-5 pb-3.5 border-b border-[rgba(44,40,37,0.1)]">
                Mano vs. the rest
              </div>
              <div className="flex flex-col gap-3">
                {comparisons.map((c) => (
                  <div key={c.label} className={styles.privacyRow}>
                    <span className="text-ink-light font-normal">{c.label}</span>
                    <span className={`${styles.badge} ${badgeClass[c.type]}`}>
                      {c.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
