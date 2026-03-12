import FadeUp from "./FadeUp";
import styles from "@/app/(marketing)/marketing.module.css";

const chaosItems = [
  { tool: "WhatsApp", pain: "Booking & follow-ups", desc: "Client data lives on your personal phone. Zero privacy. No structure." },
  { tool: "Google Forms", pain: "Client intake", desc: "Manual, unstructured. Copy-pasted into Notion. No automation." },
  { tool: "Google Calendar", pain: "Scheduling", desc: "No reminders. No buffer time. Clients email to reschedule." },
  { tool: "Zoom / Meet", pain: "Sessions", desc: "Links sent manually over WhatsApp. No session record." },
  { tool: "Notion / Paper", pain: "Session notes", desc: "Unstructured. Not searchable. Stored on personal devices." },
  { tool: "UPI Screenshot", pain: "Payments", desc: "No invoices. No records. Tax season becomes a nightmare." },
];

const solutionChips = ["Booking", "Payments", "Notes", "Sessions", "AI Assist", "Messaging"];

export default function Problem() {
  return (
    <section id="problem" className="relative z-[1] py-24">
      <div className="max-w-[1120px] mx-auto px-8">
        <div className="text-xs font-medium uppercase tracking-[1.5px] text-sage mb-3.5">
          The problem
        </div>
        <h2 className="font-heading text-[clamp(26px,4vw,40px)] font-medium leading-[1.2] tracking-tight text-ink mb-4">
          You&apos;re running a practice
          <br />
          across <em className="italic text-sage">six broken tools.</em>
        </h2>
        <p className="text-base font-light text-ink-light leading-relaxed max-w-[500px]">
          Every therapist we spoke to uses the same chaotic stack. None of it
          talks to each other. None of it is private.
        </p>

        <div className="mt-[60px] grid grid-cols-1 md:grid-cols-3 gap-4">
          {chaosItems.map((item, i) => (
            <FadeUp key={item.tool} delay={i * 0.08}>
              <div className={styles.chaosCard}>
                <div className={styles.chaosTool}>{item.tool}</div>
                <div className="text-sm font-light text-ink-light leading-relaxed">
                  <strong className="block mb-1 text-[15px] font-medium text-ink">
                    {item.pain}
                  </strong>
                  {item.desc}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <div className="flex justify-center my-10 text-ink-lighter text-xl">
            &darr;
          </div>
        </FadeUp>

        <FadeUp>
          <div className={styles.solutionBanner}>
            <div>
              <div className="font-heading text-[22px] font-medium leading-snug tracking-tight">
                Mano replaces all of it.
                <br />
                One system. Completely private.
              </div>
              <div className="text-sm font-light opacity-80 mt-1.5 leading-relaxed">
                Built from the ground up for how Indian therapists actually work.
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {solutionChips.map((chip) => (
                <span key={chip} className={styles.solutionChip}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
