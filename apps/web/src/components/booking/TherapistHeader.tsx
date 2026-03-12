import Image from "next/image";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

interface TherapistHeaderProps {
  displayName: string;
  fullName: string;
  bio: string | null;
  qualifications: string | null;
  avatarUrl: string | null;
}

export default function TherapistHeader({
  displayName,
  fullName,
  bio,
  qualifications,
  avatarUrl,
}: TherapistHeaderProps) {
  return (
    <div className="text-center space-y-5 pb-2">
      {/* Avatar */}
      <div className="flex justify-center">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={80}
            height={80}
            className="rounded-full ring-4 ring-white shadow-md"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-sage-50 ring-4 ring-white shadow-md flex items-center justify-center">
            <Image
              src={LOGO_URL}
              alt="Mano"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
        )}
      </div>

      {/* Name & credentials */}
      <div className="space-y-1">
        <h1 className="text-2xl font-heading font-semibold text-ink">
          {fullName}
        </h1>
        {qualifications && (
          <p className="text-sm text-ink-lighter">{qualifications}</p>
        )}
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-sm text-ink-light leading-relaxed max-w-sm mx-auto">
          {bio}
        </p>
      )}

      {/* Divider */}
      <div className="border-b border-cream-300" />
    </div>
  );
}
