import type { Metadata } from "next";
import { Providers } from "./providers";
import "@/styles/globals.css";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp";

export const metadata: Metadata = {
  title: "Mano — Practice Management for Therapists",
  description:
    "Privacy-first practice management platform for independent therapists in India. Manage clients, sessions, payments, and more.",
  icons: { icon: LOGO_URL, apple: LOGO_URL },
  openGraph: {
    title: "Mano — Your practice, finally at peace",
    description:
      "Privacy-first practice management for independent therapists in India.",
    images: [LOGO_URL],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
