import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { authorizeAdminRequest } from '@/lib/security/admin-auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: './',
  },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authorization = await authorizeAdminRequest();

  if (!authorization.authorized) {
    if (authorization.reason === 'unauthenticated') {
      redirect('/sign-in?redirect_url=%2Fadmin');
    }

    notFound();
  }

  return children;
}
