import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Review Responder — Respond to Every Review in Seconds",
  description:
    "AI writes professional responses to your Google, Yelp, and Facebook reviews in your brand voice. Try free.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="bg-navy text-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              ReviewAI
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/app" className="hover:text-gray-300 transition-colors">
                App
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
              <Link href="/app" className="hover:text-white transition-colors">
                App
              </Link>
              <Link href="/upgrade" className="hover:text-white transition-colors">
                Pricing
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
