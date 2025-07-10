import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | The Snap Admin',
  description: 'View website analytics and performance metrics',
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Analytics Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Placeholder cards for analytics metrics */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Page Views</h3>
            <p className="text-3xl font-bold text-white">-</p>
            <p className="text-sm text-gray-400 mt-1">Analytics coming soon</p>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Unique Visitors</h3>
            <p className="text-3xl font-bold text-white">-</p>
            <p className="text-sm text-gray-400 mt-1">Analytics coming soon</p>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Article Views</h3>
            <p className="text-3xl font-bold text-white">-</p>
            <p className="text-sm text-gray-400 mt-1">Analytics coming soon</p>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Bounce Rate</h3>
            <p className="text-3xl font-bold text-white">-</p>
            <p className="text-sm text-gray-400 mt-1">Analytics coming soon</p>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
          <p className="text-gray-300">
            This analytics dashboard will show detailed metrics about your website performance, 
            article engagement, and user behavior. Integration with analytics services coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}