import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 py-12">
      <SignUp appearance={{ elements: { card: 'shadow-2xl border border-white/10 bg-[#0b0b0b]' } }} />
    </div>
  );
}
