import type { Metadata } from "next";
import { Fraunces, Inter_Tight } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthSessionProvider } from "@/components/providers/session-provider";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  weight: ["400", "500", "600"],
  display: "swap",
});

   function getSiteUrl(): string {
     const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
     if (!raw) return "http://localhost:3000";
     const withScheme = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
     try {
       new URL(withScheme);
       return withScheme;
     } catch {
       return "http://localhost:3000";
     }
   }

   const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "WanderWorld Global — Travel, Considered",
    template: "%s — WanderWorld Global",
  },
  description:
    "An AI-assisted travel platform for people who plan their trips the way they plan everything else: carefully.",
  openGraph: {
    title: "WanderWorld Global",
    description:
      "An AI-assisted travel platform for people who plan their trips the way they plan everything else: carefully.",
    siteName: "WanderWorld Global",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WanderWorld Global",
    description:
      "An AI-assisted travel platform for people who plan their trips the way they plan everything else: carefully.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${interTight.variable}`}>
      <body>
        <AuthSessionProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
