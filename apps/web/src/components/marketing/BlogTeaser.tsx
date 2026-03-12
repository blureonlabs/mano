import FadeUp from "./FadeUp";
import styles from "@/app/(marketing)/marketing.module.css";

const articles = [
  {
    title: "How to set your therapy rates in India",
    tag: "Business",
    excerpt:
      "A practical guide to pricing your services based on experience, location, and client demographics.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-sage/50"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
  },
  {
    title: "DPDP Act 2023: What therapists need to know",
    tag: "Privacy",
    excerpt:
      "Understanding your obligations under India\u2019s new data protection law when handling client records.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-sage/50"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    ),
  },
  {
    title: "Setting boundaries with async client messaging",
    tag: "Practice",
    excerpt:
      "How to use secure messaging without burning out or blurring work-life boundaries.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-sage/50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    ),
  },
];

export default function BlogTeaser() {
  return (
    <section className="relative z-[1] py-24 bg-cream-200">
      <div className="max-w-[1120px] mx-auto px-8">
        <FadeUp>
          <div className="text-center mb-14">
            <div className="text-xs font-medium uppercase tracking-[1.5px] text-sage mb-3.5">
              Resources
            </div>
            <h2 className="font-heading text-[clamp(26px,4vw,40px)] font-medium leading-[1.2] tracking-tight text-ink">
              Learn. Grow. <em className="italic text-sage">Thrive.</em>
            </h2>
            <p className="text-sm font-light text-ink-light leading-relaxed mt-4 max-w-[480px] mx-auto">
              Guides, templates, and best practices for independent therapists in India.
            </p>
          </div>
        </FadeUp>

        <div className={styles.blogGrid}>
          {articles.map((a, i) => (
            <FadeUp key={a.title} delay={i * 0.08}>
              <div className={styles.blogCard}>
                <div className={styles.blogImagePlaceholder}>
                  {a.icon}
                  <span className={styles.blogComingSoon}>Coming soon</span>
                </div>
                <div className={styles.blogContent}>
                  <span className={styles.blogTag}>{a.tag}</span>
                  <div className={styles.blogTitle}>{a.title}</div>
                  <p className={styles.blogExcerpt}>{a.excerpt}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
