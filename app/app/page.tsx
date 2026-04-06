"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface BusinessInfo {
  name: string;
  type: string;
  tone: string;
}

const BUSINESS_TYPES = [
  "Restaurant",
  "Salon/Spa",
  "Medical/Dental",
  "Retail Store",
  "Contractor/Trade",
  "Other",
];

const TONES = [
  "Professional",
  "Warm & Friendly",
  "Apologetic (for negative reviews)",
  "Enthusiastic",
];

const FREE_LIMIT = 5;

function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
}

function getResponseCount(): number {
  const stored = localStorage.getItem("responseCount");
  if (!stored) return 0;
  const parsed = JSON.parse(stored);
  if (parsed.month !== getMonthKey()) return 0;
  return parsed.count;
}

function setResponseCount(count: number) {
  localStorage.setItem(
    "responseCount",
    JSON.stringify({ month: getMonthKey(), count })
  );
}

function AppContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [business, setBusiness] = useState<BusinessInfo>({
    name: "",
    type: "Restaurant",
    tone: "Professional",
  });
  const [review, setReview] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Load saved business info
    const saved = localStorage.getItem("businessInfo");
    if (saved) setBusiness(JSON.parse(saved));

    // Load response count
    setCount(getResponseCount());

    // Load stored Pro status
    const storedEmail = localStorage.getItem("proEmail");
    if (storedEmail) {
      setEmail(storedEmail);
      setIsPro(true);
    }

    // Check for post-checkout session_id param
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      setVerifying(true);
      fetch(`/api/verify-session?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.isPro && data.email) {
            localStorage.setItem("proEmail", data.email);
            setEmail(data.email);
            setIsPro(true);
          }
        })
        .catch((err) => console.error("verify-session error:", err))
        .finally(() => {
          setVerifying(false);
          // Clean up URL
          router.replace("/app");
        });
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (mounted && business.name) {
      localStorage.setItem("businessInfo", JSON.stringify(business));
    }
  }, [business, mounted]);

  const limitReached = !isPro && count >= FREE_LIMIT;

  async function handleGenerate() {
    if (!business.name.trim() || !review.trim()) {
      setError("Please fill in your business name and paste a review.");
      return;
    }
    if (limitReached) return;

    setLoading(true);
    setError("");
    setResponse("");

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Response-Count": String(count),
      };
      if (email) headers["X-User-Email"] = email;

      const res = await fetch("/api/generate-response", {
        method: "POST",
        headers,
        body: JSON.stringify({
          review,
          businessName: business.name,
          businessType: business.type,
          tone: business.tone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate response");
      }

      const data = await res.json();
      const generatedText: string = data.response ?? "";
      if (!generatedText.trim()) {
        throw new Error("No response was generated. Please try again.");
      }
      setResponse(generatedText);

      if (!isPro) {
        const newCount = count + 1;
        setCount(newCount);
        setResponseCount(newCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="animate-pulse h-8 bg-gray-200 rounded w-1/3 mb-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-navy">
          Generate a Review Response
        </h1>
        {isPro && (
          <span className="rounded-full bg-green-cta px-3 py-1 text-xs font-bold text-white">
            PRO ✓
          </span>
        )}
      </div>

      {verifying && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 mb-6 text-sm">
          Verifying your subscription…
        </div>
      )}

      {/* Business Info */}
      <div className="rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-navy mb-4">
          Your Business Info
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={business.name}
              onChange={(e) =>
                setBusiness({ ...business, name: e.target.value })
              }
              placeholder="e.g. Joe's Pizza"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-cta focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Type
            </label>
            <select
              value={business.type}
              onChange={(e) =>
                setBusiness({ ...business, type: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-cta focus:border-transparent"
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tone
            </label>
            <select
              value={business.tone}
              onChange={(e) =>
                setBusiness({ ...business, tone: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-cta focus:border-transparent"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Review Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer Review
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Paste your review here..."
          rows={5}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-cta focus:border-transparent resize-y"
        />
      </div>

      {/* Usage Counter — hidden for Pro */}
      {!isPro && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {count} of {FREE_LIMIT} free responses used this month
          </p>
          {limitReached && (
            <Link
              href="/upgrade"
              className="text-sm font-semibold text-green-cta hover:underline"
            >
              Upgrade for unlimited
            </Link>
          )}
        </div>
      )}

      {/* Generate Button */}
      {limitReached ? (
        <div className="rounded-xl border-2 border-green-cta bg-green-50 p-6 text-center mb-8">
          <p className="text-lg font-semibold text-navy mb-2">
            You&apos;ve used all 5 free responses this month
          </p>
          <p className="text-gray-600 mb-4">
            Upgrade to Pro for unlimited responses, Google Business integration, and more.
          </p>
          <Link
            href="/upgrade"
            className="inline-block rounded-lg bg-green-cta px-6 py-3 font-semibold text-white hover:bg-green-cta-hover transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full rounded-lg bg-green-cta py-3 font-semibold text-white hover:bg-green-cta-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-8"
        >
          {loading ? "Generating..." : "Generate Response"}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Response Output */}
      {response && (
        <div className="rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-navy mb-3">
            Your Response
          </h2>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">
            {response}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light transition-colors"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || limitReached}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { Suspense } from "react";

export default function AppPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-6 py-12 animate-pulse" />}>
      <AppContent />
    </Suspense>
  );
}
