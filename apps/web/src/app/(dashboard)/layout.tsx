"use client";

import { useState } from "react";
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
  Repeat,
  UsersRound,
  Megaphone,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

const navItems = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/recurring", label: "Fixed Slots", icon: Repeat },
  { href: "/dashboard/notes", label: "Notes", icon: FileText },
  { href: "/dashboard/resources", label: "Resources", icon: FolderOpen },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/broadcast", label: "Broadcast", icon: Megaphone },
  { href: "/dashboard/team", label: "Team", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prefetch shared data at layout level — child pages get it from cache instantly
  trpc.therapist.me.useQuery();
  trpc.clients.list.useQuery();

  return (
    <div className="min-h-screen flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-sage focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      {/* Mobile header bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sage h-14 flex items-center px-4">
        <button onClick={() => setSidebarOpen(true)} className="text-white" aria-label="Open menu">
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-white font-heading text-lg ml-3">Mano</span>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed, full height; slides in on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-cream-300 p-6 space-y-8 flex flex-col transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Close button on mobile */}
        <button
          className="md:hidden absolute top-4 right-4 text-ink-lighter hover:text-ink transition-colors"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <Image src={LOGO_URL} alt="Mano" width={28} height={28} className="rounded-full" />
          <h2 className="text-xl font-heading font-bold text-sage">Mano</h2>
        </div>
        <nav aria-label="Main navigation" className="space-y-1 flex-1 overflow-y-auto">
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
                onClick={() => setSidebarOpen(false)}
                aria-current={isActive ? "page" : undefined}
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
        <button
          onClick={async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-small text-ink-lighter hover:text-ink hover:bg-cream transition-colors w-full text-left text-sm"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Log out
        </button>
      </aside>

      {/* Main content — offset by sidebar width, scrollable; top padding on mobile for header */}
      <main id="main-content" className="flex-1 md:ml-64 p-8 pt-20 md:pt-8 min-h-screen overflow-y-auto">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
