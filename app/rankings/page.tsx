import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function RankingsRedirectPage() {
  const hdrs = await headers();
  const current = new URL(hdrs.get('x-url') || 'http://localhost');
  current.pathname = '/articles';
  redirect(current.toString());
}
