import Link from "next/link";
import styles from "@/app/(marketing)/marketing.module.css";

export default function Hero() {
  return (
    <section id="hero" className="relative z-[1] pt-40 pb-24 text-center">
      <div className="max-w-[960px] mx-auto px-8">
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Built for independent therapists in India
        </div>

        <h1
          className={`font-heading text-[clamp(38px,6vw,64px)] font-medium leading-[1.15] tracking-tighter text-ink mb-5 ${styles.heroTitle}`}
        >
          Your practice,
          <br />
          <em className="italic text-sage">finally at peace.</em>
        </h1>

        <p
          className={`text-lg font-light text-ink-light leading-relaxed max-w-[520px] mx-auto mb-10 ${styles.heroSub}`}
        >
          One calm, private place for booking, sessions, notes, and payments.
          Replace WhatsApp, Notion, and UPI screenshots &mdash; forever.
        </p>

        <div
          className={`flex items-center justify-center gap-3.5 flex-wrap ${styles.heroActions}`}
        >
          <Link href="/signup" className={styles.btnPrimary}>
            Get Started Free <span>&rarr;</span>
          </Link>
          <a href="#features" className={styles.btnGhost}>
            See how it works
          </a>
        </div>

        <div
          className={`mt-[52px] flex items-center justify-center gap-2.5 text-ink-lighter text-[13px] ${styles.heroSocialProof}`}
        >
          <div className="flex">
            <div
              className={styles.heroAvatar}
              style={{ background: "#D4E5E0", color: "#4A7C6F" }}
            >
              P
            </div>
            <div
              className={styles.heroAvatar}
              style={{ background: "#D4DCE5", color: "#4A6C7C" }}
            >
              V
            </div>
            <div
              className={styles.heroAvatar}
              style={{ background: "#E5D4DC", color: "#7C4A6C" }}
            >
              A
            </div>
            <div
              className={styles.heroAvatar}
              style={{ background: "#E5E0D4", color: "#7C6C4A" }}
            >
              R
            </div>
          </div>
          <span>Join 40+ therapists on the waitlist</span>
        </div>

        {/* Demo Browser */}
        <div className={`mt-16 relative ${styles.heroDemo}`}>
          <div className={styles.demoBrowser}>
            <div className={styles.demoBrowserBar}>
              <div className="flex gap-1.5">
                <div className={styles.demoDot} style={{ background: "#F5A8A8" }} />
                <div className={styles.demoDot} style={{ background: "#F5D5A8" }} />
                <div className={styles.demoDot} style={{ background: "#A8D5A8" }} />
              </div>
              <div className={styles.demoUrl}>vidhya.mano.app</div>
            </div>
            <div className={styles.demoBody}>
              <div className={styles.demoSidebar}>
                <div className={styles.demoSidebarHeader}>Mano</div>
                <DemoNavItem label="Today" active />
                <DemoNavItem label="Schedule" />
                <DemoNavItem label="Clients" />
                <DemoNavItem label="Notes" />
                <DemoNavItem label="Payments" />
              </div>
              <div className="flex flex-col gap-3.5">
                <div>
                  <div className="font-heading text-lg font-medium text-ink mb-1">
                    Good morning, Dr. Vidhya
                  </div>
                  <div className="text-xs text-ink-lighter">
                    Tuesday, 10 March &middot; 3 sessions today
                  </div>
                </div>
                <div className="text-[11px] font-medium text-ink-lighter uppercase tracking-wider mt-1">
                  Today&apos;s Sessions
                </div>
                <SessionCard name="Ananya Sharma" initials="A" time="10:00 AM · 50 min · Session 8" tag="Starting soon" tagStyle="tagUpcoming" avatarBg="#D4E5E0" avatarColor="#4A7C6F" />
                <SessionCard name="Rahul Menon" initials="R" time="12:30 PM · 50 min · Session 3" tag="Note ready" tagStyle="tagAi" avatarBg="#D4DCE5" avatarColor="#4A6C7C" />
                <SessionCard name="Priya Nair" initials="P" time="4:00 PM · 50 min · Session 12" tag="Scheduled" tagStyle="tagDone" avatarBg="#E5D4DC" avatarColor="#7C4A6C" />
                <div className="flex gap-2 mt-1">
                  <div className={styles.demoQuickBtn}>+ Add note</div>
                  <div className={styles.demoQuickBtn}>Block time</div>
                  <div className={styles.demoQuickBtn}>Message client</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoNavItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={`${styles.demoNavItem} ${active ? styles.demoNavItemActive : ""}`}
    >
      <span className="text-sm">&#9679;</span> {label}
    </div>
  );
}

function SessionCard({
  name,
  initials,
  time,
  tag,
  tagStyle,
  avatarBg,
  avatarColor,
}: {
  name: string;
  initials: string;
  time: string;
  tag: string;
  tagStyle: "tagUpcoming" | "tagAi" | "tagDone";
  avatarBg: string;
  avatarColor: string;
}) {
  return (
    <div className={styles.demoSessionCard}>
      <div className="flex items-center gap-2.5">
        <div
          className={styles.demoSessionAvatar}
          style={{ background: avatarBg, color: avatarColor }}
        >
          {initials}
        </div>
        <div>
          <div className="text-[13px] font-medium text-ink">{name}</div>
          <div className="text-[11.5px] text-ink-lighter">{time}</div>
        </div>
      </div>
      <span className={`${styles.demoTag} ${styles[tagStyle]}`}>{tag}</span>
    </div>
  );
}
