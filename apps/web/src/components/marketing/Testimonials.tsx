import FadeUp from "./FadeUp";
import styles from "@/app/(marketing)/marketing.module.css";

const testimonials = [
  {
    quote:
      "I spend 2–3 hours every week on admin. Sending reminders, chasing payments, copying notes. This is the first tool that feels like it was actually built for someone like me.",
    name: "Dr. Vidhya R.",
    role: "Clinical Psychologist · Bangalore",
    initials: "V",
    avatarBg: "#D4E5E0",
    avatarColor: "#4A7C6F",
  },
  {
    quote:
      "The privacy aspect matters so much. My clients share deeply personal things. Knowing their data isn't flowing through WhatsApp or being used to train some AI model — that gives me peace of mind.",
    name: "Preethi M.",
    role: "Counselling Psychologist · Chennai",
    initials: "P",
    avatarBg: "#D4DCE5",
    avatarColor: "#4A6C7C",
  },
  {
    quote:
      "The AI notes are what got my attention. I type rough fragments after sessions. Getting a clean, structured SOAP note back in seconds — that's an hour of my week returned to me.",
    name: "Asha K.",
    role: "Psychotherapist · Mumbai",
    initials: "A",
    avatarBg: "#E5D4DC",
    avatarColor: "#7C4A6C",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative z-[1] py-24">
      <div className="max-w-[1120px] mx-auto px-8">
        <div className="text-center mb-14">
          <div className="text-xs font-medium uppercase tracking-[1.5px] text-sage mb-3.5">
            Early voices
          </div>
          <h2 className="font-heading text-[clamp(26px,4vw,40px)] font-medium leading-[1.2] tracking-tight text-ink">
            What therapists are saying
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.08}>
              <div className={styles.testimonialCard}>
                <div className="text-amber text-xs mb-3 tracking-wider">
                  ★★★★★
                </div>
                <p className="font-heading text-[15px] font-normal italic text-ink leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-2.5">
                  <div
                    className={styles.testimonialAvatar}
                    style={{ background: t.avatarBg, color: t.avatarColor }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-[13.5px] font-medium text-ink">
                      {t.name}
                    </div>
                    <div className="text-xs text-ink-lighter font-light">
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
