import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://reviews.aiwolfsolutions.com"),
  title: {
    default: "ReviewAI — AI-Powered Google Review Response Management",
    template: "%s | ReviewAI",
  },
  description:
    "Never miss a Google review again. ReviewAI auto-drafts professional responses to every Google review in seconds. Connect your Google Business Profile, approve with one click, and publish. Free to start.",
  keywords: [
    "google review management",
    "ai review response",
    "google business profile",
    "review automation",
    "restaurant review management",
  ],
  openGraph: {
    title: "ReviewAI — AI-Powered Google Review Response Management",
    description:
      "Never miss a Google review again. ReviewAI auto-drafts professional responses to every Google review in seconds. Connect your Google Business Profile, approve with one click, and publish. Free to start.",
    url: "https://reviews.aiwolfsolutions.com",
    siteName: "ReviewAI",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ReviewAI — AI-Powered Google Review Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewAI — AI-Powered Google Review Response Management",
    description:
      "Never miss a Google review again. ReviewAI auto-drafts professional responses to every Google review in seconds.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="bg-navy text-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              ReviewAI
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/app/dashboard" className="hover:text-gray-300 transition-colors">
                Dashboard
              </Link>
              <Link href="/app" className="hover:text-gray-300 transition-colors">
                Quick Response
              </Link>
              <Link href="/audit" className="hover:text-gray-300 transition-colors">
                Free Audit
              </Link>
              <Link href="/upgrade" className="hover:text-gray-300 transition-colors">
                Pricing
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-navy text-gray-400 text-sm">
          <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>&copy; {new Date().getFullYear()} ReviewAI. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/app/dashboard" className="hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/app" className="hover:text-white transition-colors">
                Quick Response
              </Link>
              <Link href="/upgrade" className="hover:text-white transition-colors">
                Pricing
              </Link>
            </div>
          </div>
        </footer>

        {/* Floating feedback button */}
        <a
          href="mailto:andrew@aiwolfsolutions.com?subject=ReviewAI%20Feedback"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-green-cta px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-green-cta-hover transition-colors"
          title="Send feedback"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
            <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
          </svg>
          Need Help?
        </a>
      </body>
    </html>
  );
}
