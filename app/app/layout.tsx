import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Review Response Generator",
  description:
    "Paste any Google review and get a professional AI-drafted response in seconds. Free for 5 responses per month. Works for restaurants, salons, clinics, retail stores, contractors, and more.",
  alternates: {
    canonical: "https://reviews.aiwolfsolutions.com/app",
  },
  openGraph: {
    title: "Free AI Review Response Generator | ReviewAI",
    description:
      "Paste any Google review and get a professional AI-drafted response in seconds. Free for 5 responses per month. No account required.",
    url: "https://reviews.aiwolfsolutions.com/app",
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
