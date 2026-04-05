import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ReviewAI — AI-Powered Google Review Response Management",
  description:
    "Never miss a Google review again. ReviewAI auto-drafts professional responses to every Google review in seconds. Connect your Google Business Profile, approve with one click, and publish. Free to start.",
  alternates: {
    canonical: "https://reviews.aiwolfsolutions.com",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ReviewAI",
  applicationCategory: "BusinessApplication",
  url: "https://reviews.aiwolfsolutions.com",
  description:
    "AI-powered Google review response management. Auto-draft professional responses to every review, approve with one click, and publish directly to your Google Business Profile.",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      description: "5 AI-drafted responses per month, all business types, multiple tone options",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "49",
      priceCurrency: "USD",
      description: "Unlimited responses, Google Business integration, 1 location monitored, email alerts, one-click publish",
    },
    {
      "@type": "Offer",
      name: "Business",
      price: "99",
      priceCurrency: "USD",
      description: "Everything in Pro, up to 5 locations monitored, team access (5 members), priority support, custom voice training",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "47",
  },
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="bg-white">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-navy leading-tight">
          Never miss a Google review again
          <span className="block text-green-cta mt-2">
            — AI responds in seconds
          </span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          Connect your Google Business Profile. Get AI-drafted responses for
          every review. Approve and publish with one click.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/app/dashboard"
            className="rounded-lg bg-green-cta px-8 py-4 text-lg font-semibold text-white shadow-md hover:bg-green-cta-hover transition-colors"
          >
            Start Free — Connect Google
          </Link>
          <Link
            href="/app/dashboard?demo=true"
            className="rounded-lg border-2 border-navy px-8 py-4 text-lg font-semibold text-navy hover:bg-navy hover:text-white transition-colors"
          >
            See it in action →
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          No credit card required &bull; Try the live demo instantly
        </p>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-center text-navy mb-12">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <StepCard
              step="1"
              title="Connect Google Business"
              description="Link your Google Business Profile in one click. We automatically detect all your locations."
            />
            <StepCard
              step="2"
              title="AI drafts every response"
              description="When a new review comes in, AI instantly drafts a professional, on-brand response for your approval."
            />
            <StepCard
              step="3"
              title="Approve & publish"
              description="Review the draft, edit if needed, and publish directly to Google. Done in 10 seconds."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-center text-navy mb-12">
            Why business owners switch to ReviewAI
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <FeatureCard
              title="Auto-detect new reviews"
              description="We monitor your Google Business Profile 24/7 and alert you the moment a new review comes in."
            />
            <FeatureCard
              title="Sounds like you wrote it"
              description="Set your tone and business type once. Every response matches your brand voice perfectly."
            />
            <FeatureCard
              title="Multi-location dashboard"
              description="Manage reviews across all your locations from one screen. See ratings, response rates, and trends."
            />
            <FeatureCard
              title="Email alerts"
              description="Get notified instantly when you get a new review — especially the 1-star ones that need fast action."
            />
            <FeatureCard
              title="One-click publish"
              description="Approve the AI draft and it's published to Google immediately. No copy-paste needed."
            />
            <FeatureCard
              title="Works for any business"
              description="Restaurants, salons, clinics, retail stores, contractors — optimized responses for every industry."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-gray-600 mb-12 max-w-xl mx-auto">
            Start free. Upgrade when you want to automate review monitoring and
            responses.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-navy">Free</h3>
              <p className="mt-2 text-4xl font-bold text-navy">$0</p>
              <p className="mt-1 text-gray-500">forever</p>
              <ul className="mt-6 space-y-3 text-left text-gray-700 text-sm">
                <PricingFeature text="5 responses per month" />
                <PricingFeature text="All business types" />
                <PricingFeature text="Multiple tone options" />
              </ul>
              <Link
                href="/app"
                className="mt-8 block rounded-lg border-2 border-navy py-3 font-semibold text-navy hover:bg-navy hover:text-white transition-colors text-sm"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-xl border-2 border-green-cta bg-white p-8 relative shadow-lg">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-cta text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </span>
              <h3 className="text-lg font-semibold text-navy">Pro</h3>
              <p className="mt-2 text-4xl font-bold text-navy">$49</p>
              <p className="mt-1 text-gray-500">per month</p>
              <ul className="mt-6 space-y-3 text-left text-gray-700 text-sm">
                <PricingFeature text="Unlimited responses" />
                <PricingFeature text="Google Business integration" />
                <PricingFeature text="1 location monitored" />
                <PricingFeature text="Email alerts" />
                <PricingFeature text="One-click publish" />
              </ul>
              <Link
                href="/upgrade"
                className="mt-8 block rounded-lg bg-green-cta py-3 font-semibold text-white hover:bg-green-cta-hover transition-colors text-sm"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Business */}
            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-navy">Business</h3>
              <p className="mt-2 text-4xl font-bold text-navy">$99</p>
              <p className="mt-1 text-gray-500">per month</p>
              <ul className="mt-6 space-y-3 text-left text-gray-700 text-sm">
                <PricingFeature text="Everything in Pro" />
                <PricingFeature text="Up to 5 locations" />
                <PricingFeature text="Team access (5 members)" />
                <PricingFeature text="Priority support" />
                <PricingFeature text="Custom voice training" />
              </ul>
              <Link
                href="/upgrade"
                className="mt-8 block rounded-lg border-2 border-navy py-3 font-semibold text-navy hover:bg-navy hover:text-white transition-colors text-sm"
              >
                Upgrade to Business
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
            Stop losing customers to unanswered reviews
          </h2>
          <p className="text-gray-600 mb-8">
            Businesses that respond to reviews see 12% higher ratings on
            average. Start responding to every review in seconds.
          </p>
          <Link
            href="/app/dashboard"
            className="inline-block rounded-lg bg-green-cta px-8 py-4 text-lg font-semibold text-white shadow-md hover:bg-green-cta-hover transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
    </>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-cta text-white text-lg font-bold mb-4">
        {step}
      </div>
      <h3 className="text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-2 text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-2 text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-green-cta font-bold mt-0.5">&#10003;</span>
      {text}
    </li>
  );
}
