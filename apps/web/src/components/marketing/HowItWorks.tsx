import FadeUp from "./FadeUp";
import styles from "@/app/(marketing)/marketing.module.css";

const steps = [
  {
    num: "1",
    title: "Create your account",
    desc: "Sign up with your email. Set your profile, rates, and session duration.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-sage"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
    ),
  },
  {
    num: "2",
    title: "Set your availability",
    desc: "Mark your open hours. Mano handles conflicts and double-bookings.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-sage"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    ),
  },
  {
    num: "3",
    title: "Share your link",
    desc: "Send mano.app/yourname to clients. They book, pay, and confirm instantly.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-sage"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="relative z-[1] py-24">
      <div className="max-w-[1120px] mx-auto px-8">
        <FadeUp>
          <div className="text-center mb-14">
            <div className="text-xs font-medium uppercase tracking-[1.5px] text-sage mb-3.5">
              Get started
            </div>
            <h2 className="font-heading text-[clamp(26px,4vw,40px)] font-medium leading-[1.2] tracking-tight text-ink">
              Up and running in <em className="italic text-sage">minutes</em>
            </h2>
          </div>
        </FadeUp>

        <div className={styles.stepGrid}>
          {steps.map((step, i) => (
            <FadeUp key={step.num} delay={i * 0.1}>
              <div className={styles.stepItem}>
                {i < steps.length - 1 && <div className={styles.stepConnector} />}
                <div className={styles.stepBadge}>{step.icon}</div>
                <div className="font-heading text-lg font-medium text-ink mb-1.5 tracking-tight">
                  {step.title}
                </div>
                <p className="text-sm font-light text-ink-light leading-relaxed max-w-[280px] mx-auto">
                  {step.desc}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
