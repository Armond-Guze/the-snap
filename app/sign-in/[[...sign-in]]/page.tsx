import type { Metadata } from 'next'

import AuthShell from '@/app/components/auth/AuthShell'
import CustomAuthFlow from '@/app/components/auth/CustomAuthFlow'

export const metadata: Metadata = {
  title: 'Log In | The Snap',
  description: 'Log in to your The Snap account.',
  alternates: { canonical: '/sign-in' },
  robots: { index: false, follow: false },
}

export default function SignInPage() {
  return (
    <AuthShell
      title="Log in or sign up"
      subtitle="Get access to NFL news, rankings, betting guides, and the stories you want to follow."
    >
      <CustomAuthFlow />
    </AuthShell>
  )
}
