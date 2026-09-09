import { SignedIn, SignedOut, SignInButton, SignOutButton, SignUpButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Account | The Snap",
  description: "Sign in to manage your The Snap account.",
  alternates: { canonical: `${SITE_URL}/account` },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AccountPage() {
  return (
    <main className="min-h-[70vh] bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-xl space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>

        <SignedOut>
          <p className="text-sm text-white/75">
            Sign in to manage your account and personalize your experience.
          </p>
          <div className="flex gap-3">
            <SignInButton mode="modal">
              <button className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                Create account
              </button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <span className="text-sm text-white/80">You are signed in.</span>
          </div>
          <SignOutButton>
            <button className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
              Sign out
            </button>
          </SignOutButton>
        </SignedIn>
      </div>
    </main>
  );
}
