import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Plans Starting Free",
  description:
    "Start free with 5 AI-drafted review responses per month. Upgrade to Pro ($49/mo) for unlimited responses, Google Business integration, and one-click publish. Business plan covers up to 5 locations.",
  alternates: {
    canonical: "https://reviews.aiwolfsolutions.com/upgrade",
  },
  openGraph: {
    title: "ReviewAI Pricing — Plans Starting Free",
    description:
      "Free plan available. Pro at $49/mo for unlimited AI review responses and Google Business integration. Business at $99/mo for multi-location management.",
    url: "https://reviews.aiwolfsolutions.com/upgrade",
  },
};

export default function UpgradeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
