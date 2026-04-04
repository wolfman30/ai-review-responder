"use client";

import { useState } from "react";
import Link from "next/link";

export default function UpgradePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpgrade() {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start checkout");
      }

      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
        Unlock Unlimited Responses
      </h1>
      <p className="text-lg text-gray-600 mb-10">
        Stop worrying about limits. Respond to every review, every time.
      </p>

      <div className="rounded-xl border-2 border-green-cta p-8 mb-8">
        <p className="text-5xl font-bold text-navy">$19</p>
        <p className="text-gray-500 mt-1">per month</p>

        <ul className="mt-8 space-y-4 text-left max-w-sm mx-auto">
          <li className="flex items-start gap-3">
            <span className="text-green-cta font-bold text-lg mt-0.5">&#10003;</span>
            <span className="text-gray-700">
              <strong>Unlimited</strong> AI-generated review responses
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-cta font-bold text-lg mt-0.5">&#10003;</span>
            <span className="text-gray-700">
              All business types and tone options
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-cta font-bold text-lg mt-0.5">&#10003;</span>
            <span className="text-gray-700">
              Priority support via email
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-cta font-bold text-lg mt-0.5">&#10003;</span>
            <span className="text-gray-700">Cancel anytime — no contracts</span>
          </li>
        </ul>

        <div className="mt-8 max-w-sm mx-auto">
          <label className="block text-sm font-medium text-gray-700 text-left mb-1">
            Your email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-cta focus:border-transparent"
          />
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full rounded-lg bg-green-cta py-4 text-lg font-semibold text-white hover:bg-green-cta-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Redirecting to checkout..." : "Subscribe to Pro — $19/mo"}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}
      </div>

      <p className="text-sm text-gray-400">
        Secure payment powered by Stripe. Cancel anytime.
      </p>

      <Link
        href="/app"
        className="inline-block mt-6 text-sm text-gray-500 hover:text-navy transition-colors"
      >
        &larr; Back to app
      </Link>
    </div>
  );
}
