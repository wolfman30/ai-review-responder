import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-navy leading-tight">
          Respond to every review in 30 seconds
          <span className="block text-green-cta mt-2">— in your brand voice</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          AI writes professional responses to your Google, Yelp, and Facebook
          reviews. Copy and paste. Done.
        </p>
        <Link
          href="/app"
          className="mt-8 inline-block rounded-lg bg-green-cta px-8 py-4 text-lg font-semibold text-white shadow-md hover:bg-green-cta-hover transition-colors"
        >
          Try Free — No Credit Card
        </Link>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-center text-navy mb-12">
            Why business owners love ReviewAI
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <FeatureCard
              title="Sounds like you wrote it"
              description="Set your tone and business type once. Every response matches your brand voice perfectly."
            />
            <FeatureCard
              title="5 responses free every month"
              description="Get started at no cost. Upgrade only when you need unlimited responses."
            />
            <FeatureCard
              title="Works for any business type"
              description="Restaurants, salons, clinics, retail stores, contractors — we've got you covered."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-2xl font-bold text-navy mb-12">
            Simple, honest pricing
          </h2>
          <div className="grid sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="rounded-xl border border-gray-200 p-8">
              <h3 className="text-lg font-semibold text-navy">Free</h3>
              <p className="mt-2 text-4xl font-bold text-navy">$0</p>
              <p className="mt-1 text-gray-500">per month</p>
              <ul className="mt-6 space-y-3 text-left text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-cta font-bold mt-0.5">&#10003;</span>
                  5 responses per month
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-cta font-bold mt-0.5">&#10003;</span>
                  All business types
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-cta font-bold mt-0.5">&#10003;</span>
                  Multiple tone options
                </li>
              </ul>
              <Link
                href="/app"
                className="mt-8 block rounded-lg border-2 border-navy py-3 font-semibold text-navy hover:bg-navy hover:text-white transition-colors"
              >
                Get Started
              </Link>
            </div>

            <div className="rounded-xl border-2 border-green-cta p-8 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-cta text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </span>
              <h3 className="text-lg font-semibold text-navy">Pro</h3>
              <p className="mt-2 text-4xl font-bold text-navy">$19</p>
              <p className="mt-1 text-gray-500">per month</p>
              <ul className="mt-6 space-y-3 text-left text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-cta font-bold mt-0.5">&#10003;</span>
                  Unlimited responses
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-cta font-bold mt-0.5">&#10003;</span>
                  All business types
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-cta font-bold mt-0.5">&#10003;</span>
                  Priority support
                </li>
              </ul>
              <Link
                href="/upgrade"
                className="mt-8 block rounded-lg bg-green-cta py-3 font-semibold text-white hover:bg-green-cta-hover transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>
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
