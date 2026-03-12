import FadeUp from "./FadeUp";
import styles from "@/app/(marketing)/marketing.module.css";

const articles = [
  {
    title: "How to set your therapy rates in India",
    tag: "Business",
    excerpt:
      "A practical guide to pricing your services based on experience, location, and client demographics.",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=340&fit=crop&q=80",
  },
  {
    title: "DPDP Act 2023: What therapists need to know",
    tag: "Privacy",
    excerpt:
      "Understanding your obligations under India\u2019s new data protection law when handling client records.",
    image: "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=600&h=340&fit=crop&q=80",
  },
  {
    title: "Setting boundaries with async client messaging",
    tag: "Practice",
    excerpt:
      "How to use secure messaging without burning out or blurring work-life boundaries.",
    image: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=600&h=340&fit=crop&q=80",
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
            <FadeUp key={a.title} delay={i * 0.08} className="h-full">
              <div className={styles.blogCard}>
                <div className={styles.blogImageWrap}>
                  <img
                    src={a.image}
                    alt={a.title}
                    className={styles.blogImage}
                    loading="lazy"
                  />
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
