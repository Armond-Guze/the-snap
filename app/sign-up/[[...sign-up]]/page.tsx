import type { Metadata } from 'next';
import { SignUp } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Sign Up | The Snap',
  description: 'Create your The Snap account.',
  alternates: { canonical: '/sign-up' },
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <div className="h-[100svh] overflow-hidden bg-black flex items-center justify-center px-4 sm:px-6">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'w-full flex justify-center',
            card: 'w-full max-w-[520px] md:max-w-[580px] scale-[1.02] md:scale-[1.06] origin-center shadow-2xl border border-white/10 bg-[#0b0b0b]',
            headerTitle: 'text-xl md:text-2xl',
            headerSubtitle: 'text-base',
            socialButtonsBlockButton: 'text-base',
            formButtonPrimary: 'text-base',
            formFieldInput: 'text-base',
            formFieldLabel: 'text-sm',
          },
        }}
      />
    </div>
  );
}
