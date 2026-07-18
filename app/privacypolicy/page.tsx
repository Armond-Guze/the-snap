import { permanentRedirect } from 'next/navigation';

// Legacy path: permanently redirect to new canonical slug
export const dynamic = 'force-static';
export default function LegacyPrivacyPolicy() {
  permanentRedirect('/privacy-policy');
}
