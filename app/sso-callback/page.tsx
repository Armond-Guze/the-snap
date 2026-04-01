import type { Metadata } from 'next'
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Signing In | The Snap',
  description: 'Completing sign-in for The Snap.',
  robots: { index: false, follow: false },
}

export default function SsoCallbackPage() {
  return <AuthenticateWithRedirectCallback />
}
