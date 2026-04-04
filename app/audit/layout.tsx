import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Google Review Health Audit",
  description:
    "Get a free personalized report on your Google review health. Includes response templates, best practices, and quick wins to improve your online reputation — no credit card required.",
  alternates: {
    canonical: "https://reviews.aiwolfsolutions.com/audit",
  },
  openGraph: {
    title: "Free Google Review Health Audit | ReviewAI",
    description:
      "Get a free personalized report on your Google review health. Includes response templates, best practices, and quick wins to improve your online reputation.",
    url: "https://reviews.aiwolfsolutions.com/audit",
  },
};

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
