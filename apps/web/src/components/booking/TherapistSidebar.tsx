import Image from "next/image";
import { ShieldCheck } from "lucide-react";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

interface TherapistSidebarProps {
  displayName: string;
  fullName: string;
  bio: string | null;
  qualifications: string | null;
  avatarUrl: string | null;
  cancellationPolicy: string | null;
  latePolicy: string | null;
  reschedulingPolicy: string | null;
}

export default function TherapistSidebar({
  displayName,
  fullName,
  bio,
  qualifications,
  avatarUrl,
  cancellationPolicy,
  latePolicy,
  reschedulingPolicy,
}: TherapistSidebarProps) {
  const hasPolicies = cancellationPolicy || latePolicy || reschedulingPolicy;

  return (
    <div className="sticky top-4 space-y-5">
      {/* Avatar */}
      <div className="flex justify-center">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={96}
            height={96}
            className="rounded-full ring-4 ring-white shadow-md"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-sage-50 ring-4 ring-white shadow-md flex items-center justify-center">
            <Image
              src={LOGO_URL}
              alt="Mano"
              width={48}
              height={48}
              className="rounded-full"
            />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center space-y-1.5">
        <h2 className="text-lg font-heading font-bold text-ink">{fullName}</h2>
        {qualifications && (
          <div className="flex flex-wrap justify-center gap-1">
            {qualifications.split(",").map((q) => (
              <span
                key={q.trim()}
                className="inline-flex items-center px-2 py-0.5 rounded-pill bg-cream-100 text-[10px] font-medium text-ink-lighter"
              >
                {q.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-xs text-ink-lighter leading-relaxed text-center">
          {bio}
        </p>
      )}

      {/* Policies */}
      {hasPolicies && (
        <div className="bg-cream-50 border border-cream-200 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-light">
            <ShieldCheck size={13} className="text-sage" />
            Session Policies
          </div>

          {cancellationPolicy && (
            <div>
              <div className="text-[10px] font-semibold text-ink-light uppercase tracking-wider mb-0.5">
                Cancellation
              </div>
              <p className="text-[11px] text-ink-lighter leading-relaxed">{cancellationPolicy}</p>
            </div>
          )}
          {latePolicy && (
            <div>
              <div className="text-[10px] font-semibold text-ink-light uppercase tracking-wider mb-0.5">
                Late arrival
              </div>
              <p className="text-[11px] text-ink-lighter leading-relaxed">{latePolicy}</p>
            </div>
          )}
          {reschedulingPolicy && (
            <div>
              <div className="text-[10px] font-semibold text-ink-light uppercase tracking-wider mb-0.5">
                Rescheduling
              </div>
              <p className="text-[11px] text-ink-lighter leading-relaxed">{reschedulingPolicy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
