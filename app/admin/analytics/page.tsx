import { Metadata } from 'next';
import AnalyticsDashboardClient from './AnalyticsDashboardClient';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | The Snap',
  description: 'View article analytics and view counts',
  robots: 'noindex, nofollow', // Don't index this admin page
};

export default function AnalyticsDashboard() {
  return (
    <main className="bg-black text-white min-h-screen">
      <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Analytics Dashboard
          </h1>
          <p className="text-gray-400">
            View article performance and engagement metrics (Admin Only)
          </p>
        </div>

        <AnalyticsDashboardClient />
      </div>
    </main>
  );
}
