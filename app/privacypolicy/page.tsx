import { redirect } from 'next/navigation';

// Legacy path: permanently redirect to new canonical slug
export const dynamic = 'force-static';
export default function LegacyPrivacyPolicy() {
  redirect('/privacy-policy');
}
