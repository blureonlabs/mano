import FadeUp from "./FadeUp";
import styles from "@/app/(marketing)/marketing.module.css";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DATES = [
  [null, null, null, null, null, 1, 2],
  [3, 4, 5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14, 15, 16],
  [17, 18, 19, 20, 21, 22, 23],
];

const SLOTS = ["10:00 AM", "11:00 AM", "2:00 PM", "3:30 PM"];
const PILLS = ["Mobile-friendly", "Instant confirmation", "Auto-reminders", "Payment at booking"];

export default function BookingPreview() {
  return (
    <section className="relative z-[1] py-24 bg-cream-200">
      <div className="max-w-[1120px] mx-auto px-8">
        <FadeUp>
          <div className="text-center mb-14">
            <div className="text-xs font-medium uppercase tracking-[1.5px] text-sage mb-3.5">
              For your clients
            </div>
            <h2 className="font-heading text-[clamp(26px,4vw,40px)] font-medium leading-[1.2] tracking-tight text-ink">
              A booking page that <em className="italic text-sage">works</em>
            </h2>
            <p className="text-sm font-light text-ink-light leading-relaxed mt-4 max-w-[480px] mx-auto">
              No apps to install. No WhatsApp back-and-forth. A clean link your clients will love.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.15}>
          <div className={styles.bookingMockup}>
            {/* Browser bar */}
            <div className={styles.mockBrowserBar}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#F5A8A8" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#F5D5A8" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#A8D5A8" }} />
              </div>
              <div className={styles.mockUrl}>mano.app/vidya</div>
            </div>

            {/* Therapist header */}
            <div className={styles.mockTherapistHeader}>
              <div className={styles.mockAvatar}>V</div>
              <div>
                <div className="font-heading text-[15px] font-medium text-ink">Vidya</div>
                <div className="text-[11px] text-ink-lighter">Clinical Psychologist &middot; Bangalore</div>
              </div>
            </div>

            {/* Calendar */}
            <div className={styles.mockCalendar}>
              <div className={styles.mockCalendarHeader}>March 2026</div>
              <div className={styles.mockDayRow}>
                {DAY_LABELS.map((d, i) => (
                  <div key={i} className={styles.mockDayLabel}>{d}</div>
                ))}
              </div>
              {DATES.map((week, wi) => (
                <div key={wi} className={styles.mockDateGrid}>
                  {week.map((d, di) => (
                    <div
                      key={di}
                      className={`${styles.mockDate} ${d === 12 ? styles.mockDateActive : ""}`}
                    >
                      {d ?? ""}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className={styles.mockSlotGrid}>
              {SLOTS.map((s, i) => (
                <div key={s} className={`${styles.mockSlot} ${i === 1 ? styles.mockSlotActive : ""}`}>
                  {s}
                </div>
              ))}
            </div>

            {/* Book button */}
            <div className={styles.mockBookBtn}>Book Session</div>
          </div>
        </FadeUp>

        {/* Feature pills */}
        <FadeUp delay={0.25}>
          <div className={styles.featurePillsRow}>
            {PILLS.map((p) => (
              <span key={p} className={styles.featurePill}>{p}</span>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
