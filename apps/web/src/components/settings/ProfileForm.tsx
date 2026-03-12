import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface ProfileFormProps {
  therapist: {
    full_name: string;
    display_name: string | null;
    slug: string;
    bio: string | null;
    qualifications: string | null;
    phone: string | null;
    gstin: string | null;
  };
}

export default function ProfileForm({ therapist }: ProfileFormProps) {
  const [fullName, setFullName] = useState(therapist.full_name);
  const [displayName, setDisplayName] = useState(therapist.display_name ?? "");
  const [slug, setSlug] = useState(therapist.slug);
  const [bio, setBio] = useState(therapist.bio ?? "");
  const [qualifications, setQualifications] = useState(therapist.qualifications ?? "");
  const [phone, setPhone] = useState(therapist.phone ?? "");
  const [gstin, setGstin] = useState(therapist.gstin ?? "");
  const [saved, setSaved] = useState(false);

  const utils = trpc.useUtils();
  const update = trpc.therapist.update.useMutation({
    onSuccess: () => {
      utils.therapist.me.invalidate();
      setSaved(true);
    },
  });

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  function handleSlugChange(val: string) {
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({
      full_name: fullName,
      display_name: displayName || null,
      slug,
      bio: bio || null,
      qualifications: qualifications || null,
      phone: phone || null,
      gstin: gstin || null,
    });
  }

  return (
    <section className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h2 className="text-lg font-heading font-semibold text-ink">Profile</h2>
        </div>
        <p className="text-sm text-ink-lighter">
          Your public-facing profile shown on the booking page.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fullName" className="block text-xs font-medium text-ink-light mb-1.5">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="displayName" className="block text-xs font-medium text-ink-light mb-1.5">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Dr. Priya"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
            />
          </div>
        </div>

        <div>
          <label htmlFor="slug" className="block text-xs font-medium text-ink-light mb-1.5">
            Booking page URL
          </label>
          <div className="flex items-center gap-0">
            <span className="px-3.5 py-2.5 bg-cream-100 border border-r-0 border-cream-300 rounded-l-xl text-sm text-ink-lighter">
              mano.app/booking/
            </span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
            />
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-xs font-medium text-ink-light mb-1.5">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Tell clients about your approach and experience..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow resize-none"
          />
          <div className="text-right text-[11px] text-ink-lighter mt-1">
            {bio.length}/2000
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="qualifications" className="block text-xs font-medium text-ink-light mb-1.5">
              Qualifications
            </label>
            <input
              id="qualifications"
              type="text"
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              placeholder="e.g. M.Phil Clinical Psychology, RCI"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-ink-light mb-1.5">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
            />
          </div>
        </div>

        <div className="max-w-xs">
          <label htmlFor="gstin" className="block text-xs font-medium text-ink-light mb-1.5">
            GSTIN <span className="text-ink-lighter font-normal">(optional)</span>
          </label>
          <input
            id="gstin"
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            maxLength={15}
            placeholder="e.g. 27AABCU9603R1ZM"
            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow font-mono"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={update.isPending}
            className="bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20"
          >
            {update.isPending ? "Saving..." : "Save Profile"}
          </button>
          {saved && (
            <span className="text-sm text-sage font-medium animate-pulse">
              Saved!
            </span>
          )}
          {update.error && (
            <span className="text-sm text-red-600">
              {update.error.message}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
