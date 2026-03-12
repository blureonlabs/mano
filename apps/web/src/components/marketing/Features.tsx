import FadeUp from "./FadeUp";
import styles from "@/app/(marketing)/marketing.module.css";

export default function Features() {
  return (
    <section id="features" className="relative z-[1] py-24 bg-cream-200">
      <div className="max-w-[1120px] mx-auto px-8">
        <div className="text-center mb-[60px]">
          <div className="text-xs font-medium uppercase tracking-[1.5px] text-sage mb-3.5">
            What&apos;s inside
          </div>
          <h2 className="font-heading text-[clamp(26px,4vw,40px)] font-medium leading-[1.2] tracking-tight text-ink">
            Everything you need.
            <br />
            <em className="italic text-sage">Nothing you don&apos;t.</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* AI Featured Card */}
          <FadeUp className={`${styles.featureCard} ${styles.featureCardFeatured}`}>
            <div>
              <div className={styles.featureIconWrap}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-sage"><path d="M12 3c-1 2-2 3-4 4 1.5 1 3 3 4 8 1-5 2.5-7 4-8-2-1-3-2-4-4z"/><path d="M5 9c-.5 1-1 1.5-2 2 1 .5 1.5 1 2 2 .5-1 1-1.5 2-2-1-.5-1.5-1-2-2z"/></svg>
              </div>
              <div className="font-heading text-[19px] font-medium text-ink mb-2 tracking-tight">
                AI Session Assistant
              </div>
              <p className="text-sm font-light text-ink-light leading-relaxed">
                Speak freely during sessions. Mano converts your rough
                post-session notes into clean, structured summaries &mdash;
                without recording your clients. Your notes stay yours.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {["Voice → text", "SOAP / DAP templates", "Never trains on your data"].map((t) => (
                  <span key={t} className={styles.featureTag}>{t}</span>
                ))}
              </div>
            </div>
            <div className={styles.aiDemoBlock}>
              <div className={styles.aiDemoHeader}>
                <div className={styles.aiDemoDot} />
                <span className="text-[11px] font-medium text-ink-lighter uppercase tracking-wider">
                  AI Note Assist &mdash; Live
                </span>
              </div>
              <div className="p-4 flex flex-col gap-2.5">
                <div className={styles.aiNoteRough}>
                  &ldquo;client anxiety work stress sleep poor cbt breathing
                  exercise assigned homework week&rdquo;
                </div>
                <div className="flex items-center gap-2 text-[11px] text-sage font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-sage"><path d="M12 3c-1 2-2 3-4 4 1.5 1 3 3 4 8 1-5 2.5-7 4-8-2-1-3-2-4-4z"/><path d="M5 9c-.5 1-1 1.5-2 2 1 .5 1.5 1 2 2 .5-1 1-1.5 2-2-1-.5-1.5-1-2-2z"/></svg>
                  AI generates structured note &rarr;
                </div>
                <div className={styles.aiNoteClean}>
                  <strong className="font-semibold text-sage">
                    Session Summary &middot; Ananya Sharma &middot; Session 8
                  </strong>
                  <br /><br />
                  Client presents with persistent work-related anxiety and poor
                  sleep quality. Discussed CBT techniques for cognitive
                  restructuring. Session focused on identifying negative thought
                  patterns.
                  <br /><br />
                  <strong className="font-semibold text-sage">Homework:</strong>{" "}
                  Daily breathing exercise, sleep log for one week.
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Regular feature cards */}
          <FeatureCard
            title="Your personal booking page"
            desc="Clients book, pay, and reschedule directly at yourname.mano.app. No back-and-forth. Zoom links are generated automatically."
            tags={["Custom subdomain", "Calendar sync", "Auto-reminders"]}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-sage"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
            delay={0.08}
          />
          <FeatureCard
            title="Payments that just work"
            desc="UPI, Razorpay, or card — collect payment at booking or after sessions. Invoices with GST are generated automatically. No more screenshots."
            tags={["UPI / Razorpay", "Auto-invoicing", "GST-ready"]}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-sage"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
            delay={0.16}
          />
          <FeatureCard
            title="Encrypted client records"
            desc="Every client gets a secure, structured record — sessions, notes, files, and history. Your notes are private. Clients can never see them."
            tags={["E2E encrypted", "India data residency", "DPDP compliant"]}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-sage"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
            delay={0.24}
          />
          <FeatureCard
            title="Secure in-app messaging"
            desc="Clients message you inside the platform — not WhatsApp. Asynchronous, private, and structured. Client data stays off your personal phone."
            tags={["Encrypted chat", "File sharing", "Not WhatsApp"]}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-sage"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
            delay={0.32}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  desc,
  tags,
  icon,
  delay,
}: {
  title: string;
  desc: string;
  tags: string[];
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <FadeUp delay={delay} className="h-full">
      <div className={styles.featureCard}>
        <div className={styles.featureIconWrap}>{icon}</div>
        <div className="font-heading text-[19px] font-medium text-ink mb-2 tracking-tight">
          {title}
        </div>
        <p className="text-sm font-light text-ink-light leading-relaxed flex-1">
          {desc}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {tags.map((t) => (
            <span key={t} className={styles.featureTag}>{t}</span>
          ))}
        </div>
      </div>
    </FadeUp>
  );
}
