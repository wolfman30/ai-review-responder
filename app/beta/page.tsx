"use client";

import { FormEvent, useState } from "react";

const bullets = ["AI-generated responses to all your Google reviews", "One-click publish to Google", "Free for 60 days (no credit card)"];

export default function BetaPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/beta/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      firstName: formData.get("firstName"), businessName: formData.get("businessName"), email: formData.get("email"), businessType: formData.get("businessType"), challenge: formData.get("challenge"),
    }) });
    setLoading(false);
    if (!res.ok) return alert("Something went wrong. Please try again.");
    setSubmitted(true);
    event.currentTarget.reset();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-white px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl bg-navy px-8 py-10 text-white shadow-xl">
          <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-green-200">Early Access Beta</p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">Get Free Pro Access — Help Us Build the Future of Review Management</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">We&apos;re looking for restaurant and business owners to test our AI review response tool. Free Pro plan for 60 days. All we ask: 10 minutes of honest feedback.</p>
          <div className="mt-8 space-y-4">{bullets.map((bullet) => <div key={bullet} className="flex gap-3 text-base text-slate-100"><span className="text-green-cta">&#10003;</span><span>{bullet}</span></div>)}</div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          {submitted ? (
            <div className="flex min-h-96 items-center justify-center text-center"><div><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">&#10003;</div><h2 className="text-2xl font-bold text-navy">You&apos;re on the list!</h2><p className="mt-2 text-gray-600">We&apos;ll be in touch within 24 hours.</p></div></div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field id="firstName" label="First Name" required />
              <Field id="businessName" label="Business Name" required />
              <Field id="email" label="Email" required type="email" />
              <label className="block text-sm font-medium text-gray-700">Business Type<select className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-cta" name="businessType" required><option value="">Select one</option><option>Restaurant</option><option>Retail</option><option>Service Business</option><option>Other</option></select></label>
              <label className="block text-sm font-medium text-gray-700">What&apos;s your biggest challenge with online reviews?<textarea className="mt-1 min-h-28 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-cta" name="challenge" /></label>
              <button className="w-full rounded-xl bg-green-cta px-5 py-3 font-semibold text-white transition-colors hover:bg-green-cta-hover disabled:opacity-60" disabled={loading} type="submit">{loading ? "Submitting..." : "Apply for Beta Access"}</button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ id, label, type = "text", required = false }: { id: string; label: string; type?: string; required?: boolean }) {
  return <label className="block text-sm font-medium text-gray-700">{label}<input className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-cta" id={id} name={id} required={required} type={type} /></label>;
}
