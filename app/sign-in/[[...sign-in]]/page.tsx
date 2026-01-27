import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 py-12">
      <SignIn appearance={{ elements: { card: 'shadow-2xl border border-white/10 bg-[#0b0b0b]' } }} />
    </div>
  );
}
