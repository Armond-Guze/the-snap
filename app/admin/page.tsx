import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | The Snap',
  description: 'Administration panel for The Snap website',
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href="/studio" 
            className="bg-gray-900 hover:bg-gray-800 rounded-lg p-6 transition-colors group"
          >
            <h2 className="text-2xl font-bold mb-4 group-hover:text-gray-300">Content Management</h2>
            <p className="text-gray-400">
              Manage headlines, articles, and other content via Sanity Studio.
            </p>
          </Link>
        </div>
        
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/headlines" 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
            >
              View Headlines
            </Link>
            <Link 
              href="/articles" 
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition-colors"
            >
              View Articles
            </Link>
            <Link 
              href="/studio" 
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
            >
              Edit Content
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
