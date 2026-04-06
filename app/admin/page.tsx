"use client";

import { useEffect, useState } from "react";

type Tab = "applications" | "feedback" | "reddit";

interface BetaApplication {
  id: string;
  firstName: string;
  businessName: string;
  email: string;
  businessType: string;
  challenge: string | null;
  createdAt: string;
}

interface FeedbackSubmission {
  id: string;
  rating: number;
  workingWell: string;
  couldBeBetter: string;
  createdAt: string;
}

const redditPosts = [
  {
    subreddit: "r/restaurantowners",
    title:
      "We built a free AI tool that writes Google review responses for you — looking for restaurant owners to beta test",
    body: `Hey everyone — I'm Andrew, founder of AI Wolf Solutions. I've been building an AI review response tool for restaurants and local businesses over the past few months.

Here's the problem we're solving: Most restaurant owners know they should respond to Google reviews (it helps SEO and builds trust), but writing thoughtful responses to 20+ reviews a week is genuinely time-consuming.

Our tool connects to your Google Business Profile, pulls in your reviews, and generates AI-drafted responses that actually sound human — not generic corporate-speak. You review the draft, edit if you want, and publish with one click.

We're looking for 10-15 restaurant owners to beta test for free. 60 days of full Pro access, no credit card. All we ask is 10 minutes of honest feedback at the end.

👉 Apply here: [BETA_URL]

Happy to answer questions in the comments.`,
  },
  {
    subreddit: "r/smallbusiness",
    title:
      "Free beta access: AI tool that writes your Google review responses (looking for testers)",
    body: `Quick pitch: I built a tool that connects to your Google Business Profile and drafts responses to all your reviews using AI. You approve/edit and hit publish. Takes about 2 minutes instead of 20.

Looking for small business owners (restaurants, retail, service businesses) to test it out. Free Pro plan for 60 days in exchange for honest feedback.

If you've ever felt guilty about not responding to reviews or spent way too long trying to sound professional in your replies — this is for you.

Apply: [BETA_URL]`,
  },
  {
    subreddit: "r/entrepreneur",
    title:
      "Launched an AI review management tool — looking for beta testers from the restaurant/SMB space",
    body: `Been building for a few months, finally got it to a state I'm proud of. It's an AI tool that writes Google review responses for small businesses — connects to Google Business Profile, pulls your reviews, generates drafts, one-click publish.

Not looking for hype, looking for real feedback from actual business owners. Offering 60 days free Pro access to anyone willing to actually use it and tell me what sucks.

Stack: Next.js, Prisma, Anthropic Claude for the AI responses, Google Business API.

Beta signup: [BETA_URL]

AMA about the build if you're curious.`,
  },
] as const;

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "applications", label: "Beta Applications" },
  { id: "feedback", label: "Feedback" },
  { id: "reddit", label: "Reddit Posts" },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

function renderStars(rating: number) {
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("applications");
  const [passwordInput, setPasswordInput] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [applications, setApplications] = useState<BetaApplication[]>([]);
  const [feedback, setFeedback] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedPost, setCopiedPost] = useState<string | null>(null);

  useEffect(() => {
    if (!adminKey) {
      return;
    }

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [applicationsResponse, feedbackResponse] = await Promise.all([
          fetch("/api/admin/beta-applications", {
            headers: { "x-admin-key": adminKey },
          }),
          fetch("/api/admin/feedback", {
            headers: { "x-admin-key": adminKey },
          }),
        ]);

        if (
          applicationsResponse.status === 401 ||
          feedbackResponse.status === 401
        ) {
          setAdminKey("");
          setPasswordInput("");
          setApplications([]);
          setFeedback([]);
          setError("Invalid password");
          return;
        }

        if (!applicationsResponse.ok || !feedbackResponse.ok) {
          throw new Error("Failed to load admin data");
        }

        const [applicationsData, feedbackData] = await Promise.all([
          applicationsResponse.json(),
          feedbackResponse.json(),
        ]);

        setApplications(applicationsData);
        setFeedback(feedbackData);
      } catch (loadError) {
        console.error("Admin portal load error:", loadError);
        setError("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [adminKey]);

  async function handleCopy(post: (typeof redditPosts)[number]) {
    await navigator.clipboard.writeText(`${post.title}\n\n${post.body}`);
    setCopiedPost(post.subreddit);
    setTimeout(() => setCopiedPost(null), 2000);
  }

  if (!adminKey) {
    return (
      <div className="mx-auto max-w-md px-6 py-20">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
            Admin Access
          </p>
          <h1 className="text-3xl font-bold text-navy">ReviewAI Admin</h1>
          <p className="mt-3 text-sm text-gray-600">
            Enter the admin password to view beta applicants, product feedback,
            and Reddit launch drafts.
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setError("");
              setAdminKey(passwordInput);
            }}
          >
            <label className="block text-sm font-medium text-gray-700">
              Admin Password
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-cta"
                onChange={(event) => setPasswordInput(event.target.value)}
                type="password"
                value={passwordInput}
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              className="w-full rounded-xl bg-navy px-5 py-3 font-semibold text-white transition-colors hover:bg-navy-light"
              type="submit"
            >
              Unlock Admin Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
            Admin Portal
          </p>
          <h1 className="text-3xl font-bold text-navy">ReviewAI Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2 rounded-full bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-navy text-white"
                  : "text-slate-600 hover:text-navy"
              }`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="mt-4 h-64 rounded bg-gray-100" />
        </div>
      ) : null}

      {!loading && error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && activeTab === "applications" ? (
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">First Name</th>
                  <th className="px-4 py-3">Business Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Business Type</th>
                  <th className="px-4 py-3">Challenge</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((application) => (
                  <tr key={application.id} className="align-top">
                    <td className="px-4 py-4 font-medium text-navy">
                      {application.firstName}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {application.businessName}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {application.email}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {application.businessType}
                    </td>
                    <td className="max-w-sm px-4 py-4 text-gray-700">
                      {application.challenge || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-500">
                      {formatDate(application.createdAt)}
                    </td>
                  </tr>
                ))}
                {applications.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-gray-500"
                      colSpan={6}
                    >
                      No beta applications yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "feedback" ? (
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Working Well</th>
                  <th className="px-4 py-3">Could Be Better</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feedback.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-amber-500">
                      {renderStars(item.rating)}
                    </td>
                    <td className="max-w-sm px-4 py-4 text-gray-700">
                      {item.workingWell}
                    </td>
                    <td className="max-w-sm px-4 py-4 text-gray-700">
                      {item.couldBeBetter}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
                {feedback.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-gray-500"
                      colSpan={4}
                    >
                      No feedback submissions yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === "reddit" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {redditPosts.map((post) => (
            <article
              key={post.subreddit}
              className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  {post.subreddit}
                </span>
                <button
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-navy transition-colors hover:border-green-cta hover:text-green-700"
                  onClick={() => handleCopy(post)}
                  type="button"
                >
                  {copiedPost === post.subreddit ? "Copied" : "Copy"}
                </button>
              </div>
              <h2 className="text-lg font-bold text-navy">{post.title}</h2>
              <pre className="mt-4 flex-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {post.body}
              </pre>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
