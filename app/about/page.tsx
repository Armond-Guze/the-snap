import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-black"></div>
        
        <div className="relative mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">
              About The Snap
            </h1>
            <div className="w-24 h-1 bg-white mx-auto mb-8"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Your premier destination for in-depth NFL analysis, power rankings, and the latest football news.
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-20">
            
            {/* Our Mission */}
            <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 lg:p-12">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-300 leading-relaxed">
                At The Snap, we&apos;re passionate about delivering comprehensive NFL coverage that goes beyond the surface. 
                Our team of dedicated football analysts brings you weekly power rankings, breaking news, and insightful 
                commentary that helps you stay ahead of the game.
              </p>
            </section>

            {/* What We Offer */}
            <section>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What We Offer</h2>
                <div className="w-16 h-1 bg-white mx-auto"></div>
              </div>
              
              <div className="grid gap-8 md:grid-cols-2">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:bg-gray-900/70 transition-all duration-300 group">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mr-4 group-hover:bg-gray-700 transition-colors">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Weekly Power Rankings</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Our comprehensive NFL power rankings are updated weekly, providing detailed analysis of each team&apos;s 
                    performance, trends, and outlook.
                  </p>
                </div>
                
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:bg-gray-900/70 transition-all duration-300 group">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mr-4 group-hover:bg-gray-700 transition-colors">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Breaking News</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Stay up-to-date with the latest NFL headlines, trades, injuries, and developments that impact 
                    your favorite teams.
                  </p>
                </div>
                
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:bg-gray-900/70 transition-all duration-300 group">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mr-4 group-hover:bg-gray-700 transition-colors">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Expert Analysis</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Our experienced analysts provide deep insights into game strategies, player performances, 
                    and season-long trends.
                  </p>
                </div>
                
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:bg-gray-900/70 transition-all duration-300 group">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center mr-4 group-hover:bg-gray-700 transition-colors">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Community Focus</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    We believe football is more than just a game—it&apos;s a community. Join our growing audience 
                    of passionate NFL fans.
                  </p>
                </div>
              </div>
            </section>

            {/* Why Choose The Snap */}
            <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 lg:p-12">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Why Choose The Snap?</h2>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center mt-1">
                    <div className="w-3 h-3 bg-black rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">Accurate & Timely</h3>
                    <p className="text-gray-300 leading-relaxed">
                      We pride ourselves on delivering accurate information and timely updates that you can trust.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center mt-1">
                    <div className="w-3 h-3 bg-black rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">Unbiased Coverage</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Our analysis is fair and unbiased, focusing on facts and performance rather than speculation.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center mt-1">
                    <div className="w-3 h-3 bg-black rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">Fan-Focused Content</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Every piece of content we create is designed with the football fan in mind, providing 
                      the insights you crave.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Call to Action */}
            <section className="text-center py-16">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Join The Snap?</h2>
                <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
                  Stay connected with us for the latest NFL updates and analysis.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link
                    href="/headlines"
                    className="bg-white hover:bg-gray-100 text-black font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    Read Headlines
                  </Link>
                  <Link
                    href="/power-rankings"
                    className="border-2 border-white hover:bg-white hover:text-black text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    View Rankings
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-20 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} The Game Snap. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
