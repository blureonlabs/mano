"use client";

interface PortalHeaderProps {
  name: string;
  email: string | undefined;
}

export default function PortalHeader({ name, email }: PortalHeaderProps) {
  const firstName = name.split(" ")[0] || name;

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-heading font-bold text-ink">
        Welcome, {firstName}
      </h1>
      {email && (
        <p className="text-sm text-ink-lighter">{email}</p>
      )}
    </div>
  );
}
