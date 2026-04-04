"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface UserSession {
  id: string;
  email: string;
  tier: string;
  hasGoogle: boolean;
  locationCount: number;
}

interface Location {
  id: string;
  name: string;
  address: string | null;
  avgRating: number | null;
  totalReviews: number;
  lastSyncedAt: string | null;
  isMonitored: boolean;
}

interface Review {
  id: string;
  locationId: string;
  authorName: string;
  rating: number;
  text: string | null;
  reviewDate: string;
  aiDraft: string | null;
  finalResponse: string | null;
  status: string;
  location?: { name: string; id: string };
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserSession | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews">(
    "overview"
  );
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Record<string, string>>({});

  const connected = searchParams.get("connected");
  const error = searchParams.get("error");

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        return true;
      }
    } catch (err) {
      console.error("Session error:", err);
    }
    return false;
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/google/locations");
      const data = await res.json();
      if (data.locations) {
        setLocations(data.locations);
      }
    } catch (err) {
      console.error("Locations error:", err);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/google/reviews");
      const data = await res.json();
      if (data.reviews) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error("Reviews error:", err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const hasSession = await fetchSession();
      if (hasSession) {
        await Promise.all([fetchLocations(), fetchReviews()]);
      }
      setLoading(false);
    }
    init();
  }, [fetchSession, fetchLocations, fetchReviews]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail.includes("@")) return;
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail }),
      });
      if (res.ok) {
        await fetchSession();
        await Promise.all([fetchLocations(), fetchReviews()]);
      }
    } catch (err) {
      console.error("Login error:", err);
    }
    setLoginLoading(false);
  }

  async function handleSync(locationId: string) {
    setSyncing(true);
    try {
      await fetch("/api/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId }),
      });
      await Promise.all([fetchLocations(), fetchReviews()]);
    } catch (err) {
      console.error("Sync error:", err);
    }
    setSyncing(false);
  }

  async function handlePublish(reviewId: string, response: string) {
    setPublishingId(reviewId);
    try {
      const res = await fetch("/api/google/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, response }),
      });
      if (res.ok) {
        await fetchReviews();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to publish");
      }
    } catch (err) {
      console.error("Publish error:", err);
    }
    setPublishingId(null);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-20">
        <h1 className="text-3xl font-bold text-navy text-center mb-2">
          Review Dashboard
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Sign in to manage your reviews across all locations.
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="you@business.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-cta focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full rounded-lg bg-green-cta py-3 font-semibold text-white hover:bg-green-cta-hover transition-colors disabled:opacity-50"
          >
            {loginLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-4">
          No password needed. We&apos;ll create your account automatically.
        </p>
      </div>
    );
  }

  const pendingReviews = reviews.filter(
    (r) => r.status === "pending" || r.status === "drafted"
  );
  const respondedReviews = reviews.filter(
    (r) => r.status === "published" || r.status === "approved"
  );
  const responseRate =
    reviews.length > 0
      ? Math.round((respondedReviews.length / reviews.length) * 100)
      : 0;
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "N/A";

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Welcome banner */}
      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-900">
        <span className="font-semibold">Welcome to the ReviewAI beta!</span>{" "}
        If anything doesn&apos;t work as expected, email me directly at{" "}
        <a href="mailto:andrew@aiwolfsolutions.com" className="underline font-medium">
          andrew@aiwolfsolutions.com
        </a>{" "}
        — I personally read every message.{" "}
        <span className="text-green-700">&mdash; Andrew, Founder</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user.email}{" "}
            <span className="inline-block ml-2 rounded-full bg-navy text-white text-xs px-2 py-0.5 uppercase">
              {user.tier}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          {!user.hasGoogle ? (
            <a
              href={`/api/auth/google?email=${encodeURIComponent(user.email)}`}
              className="rounded-lg bg-white border-2 border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-navy hover:text-white transition-colors"
            >
              Connect Google Business
            </a>
          ) : (
            <span className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
              Google Connected
            </span>
          )}
          <Link
            href="/app"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Quick Response
          </Link>
        </div>
      </div>

      {/* Status messages */}
      {connected && (
        <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 mb-6 text-sm">
          Google Business Profile connected successfully! Your locations and
          reviews are being synced.
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm">
          {error === "google_denied"
            ? "Google authorization was denied. Please try again."
            : `Connection error: ${error}`}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Locations" value={String(locations.length)} />
        <StatCard label="Total Reviews" value={String(reviews.length)} />
        <StatCard label="Avg Rating" value={avgRating} />
        <StatCard label="Response Rate" value={`${responseRate}%`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-green-cta text-green-cta"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Locations ({locations.length})
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "reviews"
              ? "border-green-cta text-green-cta"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Review Queue ({pendingReviews.length})
        </button>
      </div>

      {/* Locations Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {locations.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <h3 className="text-lg font-semibold text-navy mb-2">
                No locations yet
              </h3>
              <p className="text-gray-500 mb-4">
                Connect your Google Business Profile to start monitoring
                reviews.
              </p>
              {!user.hasGoogle && (
                <a
                  href={`/api/auth/google?email=${encodeURIComponent(
                    user.email
                  )}`}
                  className="inline-block rounded-lg bg-green-cta px-6 py-3 font-semibold text-white hover:bg-green-cta-hover transition-colors"
                >
                  Connect Google Business
                </a>
              )}
            </div>
          ) : (
            locations.map((loc) => (
              <LocationCard
                key={loc.id}
                location={loc}
                reviewCount={
                  reviews.filter((r) => r.locationId === loc.id).length
                }
                pendingCount={
                  reviews.filter(
                    (r) =>
                      r.locationId === loc.id &&
                      (r.status === "pending" || r.status === "drafted")
                  ).length
                }
                syncing={syncing}
                onSync={() => handleSync(loc.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          {pendingReviews.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <h3 className="text-lg font-semibold text-navy mb-2">
                All caught up!
              </h3>
              <p className="text-gray-500">
                No pending reviews to respond to. Great job!
              </p>
            </div>
          ) : (
            pendingReviews
              .sort((a, b) => a.rating - b.rating) // Show low ratings first
              .map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  publishing={publishingId === review.id}
                  editDraft={editingDraft[review.id]}
                  onEditDraft={(text) =>
                    setEditingDraft((prev) => ({ ...prev, [review.id]: text }))
                  }
                  onPublish={(response) =>
                    handlePublish(review.id, response)
                  }
                  userTier={user.tier}
                />
              ))
          )}

          {respondedReviews.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-navy mt-8 mb-4">
                Recently Responded ({respondedReviews.length})
              </h3>
              {respondedReviews.slice(0, 10).map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  publishing={false}
                  userTier={user.tier}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Upgrade prompt for free users */}
      {user.tier === "free" && locations.length === 0 && (
        <div className="mt-8 rounded-xl bg-gradient-to-r from-navy to-navy-light p-8 text-white text-center">
          <h3 className="text-xl font-bold mb-2">
            Automate your review responses
          </h3>
          <p className="text-gray-300 mb-4">
            Upgrade to Pro to connect your Google Business Profile, get email
            alerts for new reviews, and publish responses with one click.
          </p>
          <Link
            href="/upgrade"
            className="inline-block rounded-lg bg-green-cta px-6 py-3 font-semibold text-white hover:bg-green-cta-hover transition-colors"
          >
            Upgrade to Pro — $49/mo
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 text-center">
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function LocationCard({
  location,
  reviewCount,
  pendingCount,
  syncing,
  onSync,
}: {
  location: Location;
  reviewCount: number;
  pendingCount: number;
  syncing: boolean;
  onSync: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-6 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-navy">{location.name}</h3>
        {location.address && (
          <p className="text-sm text-gray-500 mt-0.5">{location.address}</p>
        )}
        <div className="flex gap-4 mt-2 text-sm">
          <span className="text-gray-600">
            <strong>{location.avgRating?.toFixed(1) || "N/A"}</strong> avg
            rating
          </span>
          <span className="text-gray-600">
            <strong>{reviewCount}</strong> reviews
          </span>
          {pendingCount > 0 && (
            <span className="text-orange-600 font-medium">
              {pendingCount} need response
            </span>
          )}
        </div>
        {location.lastSyncedAt && (
          <p className="text-xs text-gray-400 mt-1">
            Last synced:{" "}
            {new Date(location.lastSyncedAt).toLocaleString()}
          </p>
        )}
      </div>
      <button
        onClick={onSync}
        disabled={syncing}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {syncing ? "Syncing..." : "Sync Reviews"}
      </button>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  publishing,
  editDraft,
  onEditDraft,
  onPublish,
  userTier,
}: {
  review: Review;
  publishing: boolean;
  editDraft?: string;
  onEditDraft?: (text: string) => void;
  onPublish?: (response: string) => void;
  userTier: string;
}) {
  const isPending = review.status === "pending" || review.status === "drafted";
  const draftText = editDraft ?? review.aiDraft ?? "";

  return (
    <div
      className={`rounded-xl border p-6 ${
        isPending && review.rating <= 2
          ? "border-red-200 bg-red-50"
          : isPending
          ? "border-yellow-200 bg-yellow-50"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-navy">{review.authorName}</span>
            <StarRating rating={review.rating} />
          </div>
          {review.location && (
            <p className="text-xs text-gray-400 mt-0.5">
              {review.location.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              review.status === "published"
                ? "bg-green-100 text-green-700"
                : review.status === "drafted"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {review.status}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(review.reviewDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {review.text && (
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          &ldquo;{review.text}&rdquo;
        </p>
      )}

      {/* AI Draft / Response */}
      {isPending && review.aiDraft && onPublish && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mt-3">
          <p className="text-xs font-medium text-gray-500 mb-2">
            AI Draft Response:
          </p>
          <textarea
            value={draftText}
            onChange={(e) => onEditDraft?.(e.target.value)}
            rows={3}
            className="w-full text-sm text-gray-700 leading-relaxed border border-gray-200 rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-cta focus:border-transparent resize-y"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onPublish(draftText)}
              disabled={publishing || userTier === "free"}
              className="rounded-lg bg-green-cta px-4 py-2 text-sm font-medium text-white hover:bg-green-cta-hover transition-colors disabled:opacity-50"
            >
              {publishing
                ? "Publishing..."
                : userTier === "free"
                ? "Upgrade to Publish"
                : "Approve & Publish"}
            </button>
          </div>
        </div>
      )}

      {review.finalResponse && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 mt-3">
          <p className="text-xs font-medium text-green-600 mb-1">
            Your response:
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {review.finalResponse}
          </p>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-12 animate-pulse" />
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
