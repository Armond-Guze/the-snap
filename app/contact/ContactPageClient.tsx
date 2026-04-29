"use client";

import { useForm, ValidationError } from "@formspree/react";

import { SimpleCard, SimplePageShell } from "../components/SimpleInfoPage";

export default function ContactPageClient() {
  const [state, handleSubmit] = useForm("xvgrgqzd");

  return (
    <SimplePageShell
      eyebrow="Contact"
      title="Contact The Snap"
      intro="For support, site questions, business inquiries, or feedback, use the form below. Keep it direct and we’ll do the same."
    >
      {state.succeeded ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-center sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10">
            <span className="text-xl font-semibold text-white">✓</span>
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white">Message sent</h2>
          <p className="mt-3 text-white/68">Thanks. We’ll get back to you as soon as possible.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="grid gap-4">
            <SimpleCard title="Email" body="thegamesnap@yahoo.com" />
            <SimpleCard title="Typical response" body="Usually within one business day." />
            <SimpleCard title="Best for" body="Support, corrections, partnerships, and product feedback." />
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="first-name" className="mb-2 block text-sm font-medium text-white/80">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="first-name"
                    autoComplete="given-name"
                    className="block w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/25"
                    placeholder="First name"
                  />
                  <ValidationError
                    prefix="First Name"
                    field="firstName"
                    errors={state.errors}
                    className="mt-1 text-sm text-red-400"
                  />
                </div>

                <div>
                  <label htmlFor="last-name" className="mb-2 block text-sm font-medium text-white/80">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="last-name"
                    autoComplete="family-name"
                    className="block w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/25"
                    placeholder="Last name"
                  />
                  <ValidationError
                    prefix="Last Name"
                    field="lastName"
                    errors={state.errors}
                    className="mt-1 text-sm text-red-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/80">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/25"
                  placeholder="you@example.com"
                />
                <ValidationError
                  prefix="Email"
                  field="email"
                  errors={state.errors}
                  className="mt-1 text-sm text-red-400"
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-white/80">
                  Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows={6}
                  required
                  className="block w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-white/25"
                  placeholder="Tell us what you need."
                />
                <ValidationError
                  prefix="Message"
                  field="message"
                  errors={state.errors}
                  className="mt-1 text-sm text-red-400"
                />
              </div>

              <button
                type="submit"
                disabled={state.submitting}
                className="inline-flex min-w-[170px] items-center justify-center rounded-full border border-white/12 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state.submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      )}
    </SimplePageShell>
  );
}
