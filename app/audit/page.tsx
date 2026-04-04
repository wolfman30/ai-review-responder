"use client";

import { useState } from "react";
import Link from "next/link";

export default function AuditPage() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim() || !email.includes("@")) {
      setError("Please enter your business name and a valid email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate audit");
      }

      const data = await res.json();
      setReport(data.report);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <span className="inline-block rounded-full bg-green-50 text-green-cta text-sm font-semibold px-4 py-1 mb-4">
          FREE TOOL
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy leading-tight">
          Free Review Health Audit
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
          Get a personalized report with response templates, best practices, and
          quick wins to improve your online reputation.
        </p>
      </section>

      {!submitted ? (
        <section className="mx-auto max-w-lg px-6 pb-20">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-200 p-8 shadow-sm"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Joe's Pizza, Glow Med Spa, ABC Dental"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-cta focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-cta focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  We&apos;ll send you the full report and review management
                  tips.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-green-cta py-3 font-semibold text-white hover:bg-green-cta-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generating your audit..." : "Get Free Audit Report"}
              </button>
            </div>
            {error && (
              <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
            )}
          </form>
        </section>
      ) : (
        <section className="mx-auto max-w-3xl px-6 pb-20">
          <div className="rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-navy">
                Review Health Audit: {businessName}
              </h2>
              <span className="text-xs text-gray-400">
                Generated {new Date().toLocaleDateString()}
              </span>
            </div>

            {/* Render markdown-ish report */}
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {report}
            </div>

            <hr className="my-8" />

            {/* Upsell */}
            <div className="rounded-xl bg-gradient-to-r from-navy to-navy-light p-8 text-white text-center">
              <h3 className="text-lg font-bold mb-2">
                Want AI to handle this automatically?
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                ReviewAI connects to your Google Business Profile, monitors for
                new reviews 24/7, and generates on-brand responses you can
                approve with one click.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/app/dashboard"
                  className="rounded-lg bg-green-cta px-6 py-3 font-semibold text-white hover:bg-green-cta-hover transition-colors text-sm"
                >
                  Try Free — 5 Responses/Month
                </Link>
                <Link
                  href="/upgrade"
                  className="rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors text-sm"
                >
                  See Pro Plans
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
