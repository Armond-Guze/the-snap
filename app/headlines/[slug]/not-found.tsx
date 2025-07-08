import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* 404 Animation/Icon */}
        <div className="relative">
          <div className="text-8xl md:text-9xl font-black text-gray-800 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <svg 
                className="w-10 h-10 md:w-12 md:h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Article Not Found
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-lg mx-auto leading-relaxed">
            The article you&apos;re looking for doesn&apos;t exist, may have been moved, or the URL might be incorrect.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/headlines" 
            className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Headlines
          </Link>
          
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 border border-slate-600 hover:border-slate-500 text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-300 hover:bg-slate-800/50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Go Home
          </Link>
        </div>

        {/* Popular Articles Suggestion */}
        <div className="mt-12 p-6 rounded-xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            Try Popular Articles
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            While you&apos;re here, check out some of our trending NFL content:
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/power-rankings" className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-full transition-colors">
              Power Rankings
            </Link>
            <Link href="/standings" className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-full transition-colors">
              NFL Standings
            </Link>
            <Link href="/headlines" className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-full transition-colors">
              Latest News
            </Link>
          </div>
        </div>

        {/* Fun Football Element */}
        <div className="opacity-20 select-none">
          <div className="text-6xl">🏈</div>
          <p className="text-xs text-gray-600 mt-2">Game over for this URL</p>
        </div>
      </div>
    </div>
  );
}
