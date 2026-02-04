import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 py-12">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'w-full flex justify-center',
            card: 'w-full max-w-[460px] md:max-w-[520px] shadow-2xl border border-white/10 bg-[#0b0b0b]',
            headerTitle: 'text-lg md:text-xl',
            headerSubtitle: 'text-sm md:text-base',
            socialButtonsBlockButton: 'text-sm md:text-base',
            formButtonPrimary: 'text-sm md:text-base',
            formFieldInput: 'text-sm md:text-base',
          },
        }}
      />
    </div>
  );
}
