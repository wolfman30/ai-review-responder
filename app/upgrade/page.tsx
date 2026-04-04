"use client";

import { useState } from "react";
import Link from "next/link";

const TIERS = [
  {
    name: "Free",
    price: 0,
    interval: "forever",
    description: "Try AI-powered review responses",
    features: [
      "5 responses per month",
      "All business types",
      "Multiple tone options",
      "Copy-paste workflow",
    ],
    cta: "Get Started Free",
    ctaHref: "/app",
    highlighted: false,
    stripePriceId: null,
  },
  {
    name: "Pro",
    price: 49,
    interval: "per month",
    description: "Auto-monitor one location",
    features: [
      "Unlimited AI responses",
      "Google Business Profile integration",
      "Auto-detect new reviews",
      "One-click publish to Google",
      "Email alerts for new reviews",
      "1 location monitored",
      "AI drafts for every review",
      "Email support",
    ],
    cta: "Start Pro — $49/mo",
    ctaHref: null,
    highlighted: true,
    stripePriceId: "pro",
  },
  {
    name: "Business",
    price: 99,
    interval: "per month",
    description: "Multi-location management",
    features: [
      "Everything in Pro",
      "Up to 5 locations monitored",
      "Multi-location dashboard",
      "Team member access (up to 5)",
      "Bulk approve AI drafts",
      "Priority support",
      "Custom brand voice training",
    ],
    cta: "Start Business — $99/mo",
    ctaHref: null,
    highlighted: false,
    stripePriceId: "business",
  },
];

export default function UpgradePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleUpgrade(tier: string) {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(tier);
    setError("");

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          tier,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start checkout");
      }

      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
          Plans that grow with your business
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Start free with manual responses. Upgrade to automate review
          monitoring and respond to customers in seconds.
        </p>
      </div>

      {/* Email input — shared across tiers */}
      <div className="max-w-sm mx-auto mb-10">
        <label className="block text-sm font-medium text-gray-700 text-center mb-2">
          Enter your email to get started
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@business.com"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-cta focus:border-transparent"
        />
        {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-xl p-8 relative ${
              tier.highlighted
                ? "border-2 border-green-cta shadow-lg"
                : "border border-gray-200"
            }`}
          >
            {tier.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-cta text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </span>
            )}

            <h3 className="text-lg font-semibold text-navy">{tier.name}</h3>
            <div className="mt-3">
              <span className="text-4xl font-bold text-navy">
                ${tier.price}
              </span>
              <span className="text-gray-500 ml-1">/{tier.interval}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{tier.description}</p>

            <ul className="mt-6 space-y-3">
              {tier.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <span className="text-green-cta font-bold mt-0.5">
                    &#10003;
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {tier.ctaHref ? (
                <Link
                  href={tier.ctaHref}
                  className={`block text-center rounded-lg py-3 font-semibold transition-colors ${
                    tier.highlighted
                      ? "bg-green-cta text-white hover:bg-green-cta-hover"
                      : "border-2 border-navy text-navy hover:bg-navy hover:text-white"
                  }`}
                >
                  {tier.cta}
                </Link>
              ) : (
                <button
                  onClick={() => handleUpgrade(tier.stripePriceId!)}
                  disabled={loading !== null}
                  className={`w-full rounded-lg py-3 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    tier.highlighted
                      ? "bg-green-cta text-white hover:bg-green-cta-hover"
                      : "border-2 border-navy text-navy hover:bg-navy hover:text-white"
                  }`}
                >
                  {loading === tier.stripePriceId
                    ? "Redirecting..."
                    : tier.cta}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-10 space-y-2">
        <p className="text-sm text-gray-400">
          Secure payment powered by Stripe. Cancel anytime. No contracts.
        </p>
        <Link
          href="/app"
          className="inline-block text-sm text-gray-500 hover:text-navy transition-colors"
        >
          &larr; Back to app
        </Link>
      </div>
    </div>
  );
}
