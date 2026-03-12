import Image from "next/image";
import Link from "next/link";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

const navItems = [
  { href: "/dashboard", label: "Today" },
  { href: "/dashboard/schedule", label: "Schedule" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/notes", label: "Notes" },
  { href: "/dashboard/payments", label: "Payments" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/settings", label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-cream-300 p-6 space-y-8 hidden md:block">
        <div className="flex items-center gap-2.5">
          <Image src={LOGO_URL} alt="Mano" width={28} height={28} className="rounded-full" />
          <h2 className="text-xl font-heading font-bold text-sage">Mano</h2>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2.5 rounded-small text-ink hover:bg-cream transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
