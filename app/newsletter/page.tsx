import NewsletterSignup from '../components/NewsletterSignup';

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="py-24 px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Subscribe to The Game Snap
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Join thousands of NFL fans who rely on our expert analysis, breaking news, and insider insights delivered straight to their inbox.
          </p>
        </div>
      </div>

      {/* Newsletter Signup */}
      <NewsletterSignup />

      {/* Benefits Section */}
      <div className="py-16 px-6 lg:px-8 bg-black">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            What You&apos;ll Get
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Weekly Power Rankings
              </h3>
              <p className="text-gray-400">
                Our expert analysis of all 32 teams with detailed breakdowns and predictions for upcoming matchups.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Breaking News Alerts
              </h3>
              <p className="text-gray-400">
                Be the first to know about trades, injuries, coaching changes, and other major NFL developments.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Exclusive Analysis
              </h3>
              <p className="text-gray-400">
                Deep dives into draft prospects, strategy breakdowns, and insider information you won&apos;t find anywhere else.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16 px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            What Our Subscribers Say
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">MJ</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Mike Johnson</h4>
                  <p className="text-gray-400 text-sm">Fantasy Football Enthusiast</p>
                </div>
              </div>
              <p className="text-gray-300">
                &quot;The Game Snap&apos;s analysis has completely transformed my fantasy team. Their injury reports and player insights are incredibly accurate.&quot;
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">SR</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Sarah Rodriguez</h4>
                  <p className="text-gray-400 text-sm">NFL Betting Analyst</p>
                </div>
              </div>
              <p className="text-gray-300">
                &quot;I&apos;ve been following The Game Snap for over a year. Their power rankings and predictions have helped me make much better betting decisions.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 px-6 lg:px-8 bg-black">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                How often will I receive emails?
              </h3>
              <p className="text-gray-400">
                We send one comprehensive newsletter per week, typically on Tuesdays, plus occasional breaking news alerts for major developments.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Can I unsubscribe at any time?
              </h3>
              <p className="text-gray-400">
                Absolutely! Every email includes an easy one-click unsubscribe link. We respect your privacy and won&apos;t send you any unwanted emails.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Is the newsletter free?
              </h3>
              <p className="text-gray-400">
                Yes! Our newsletter is completely free. We&apos;re passionate about sharing NFL insights with fellow fans and believe great content should be accessible to everyone.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                What makes your analysis different?
              </h3>
              <p className="text-gray-400">
                Our team combines advanced analytics with traditional scouting methods. We focus on actionable insights rather than just statistics, helping you understand not just what happened, but why it matters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
