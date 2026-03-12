"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileText,
  CreditCard,
  MessageCircle,
  FolderOpen,
  Settings,
} from "lucide-react";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

const navItems = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/notes", label: "Notes", icon: FileText },
  { href: "/dashboard/resources", label: "Resources", icon: FolderOpen },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Prefetch shared data at layout level — child pages get it from cache instantly
  trpc.therapist.me.useQuery();
  trpc.clients.list.useQuery();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — fixed, full height */}
      <aside className="w-64 bg-card border-r border-cream-300 p-6 space-y-8 hidden md:flex md:flex-col fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-2.5">
          <Image src={LOGO_URL} alt="Mano" width={28} height={28} className="rounded-full" />
          <h2 className="text-xl font-heading font-bold text-sage">Mano</h2>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-small transition-colors ${
                  isActive
                    ? "bg-sage-50 text-sage font-medium"
                    : "text-ink-lighter hover:bg-cream hover:text-ink"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content — offset by sidebar width, scrollable */}
      <main className="flex-1 md:ml-64 p-8 min-h-screen overflow-y-auto">{children}</main>
    </div>
  );
}
