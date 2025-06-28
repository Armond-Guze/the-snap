'use client';

import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface NewsletterSignupProps {
  variant?: 'default' | 'compact' | 'sidebar' | 'footer';
  className?: string;
}

export default function NewsletterSignup({ 
  variant = 'default', 
  className = '' 
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    
    try {
      // Simulate API call - replace with your actual newsletter service
      // This could be Mailchimp, ConvertKit, SendGrid, etc.
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      setStatus('success');
      setMessage('Thanks for subscribing! Check your email for confirmation.');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again later.');
    }
  };

  const resetStatus = () => {
    setStatus('idle');
    setMessage('');
  };

  // Compact variant for sidebars
  if (variant === 'compact') {
    return (
      <div className={`bg-black border border-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center mb-3">
          <Mail className="w-5 h-5 text-white mr-2" />
          <h3 className="text-white font-semibold text-sm">Newsletter</h3>
        </div>
        
        {status === 'success' ? (
          <div className="text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-400 text-xs">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status !== 'idle') resetStatus();
              }}
              placeholder="Enter your email"
              className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-white focus:outline-none"
              disabled={status === 'loading'}
            />
            
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full px-3 py-2 bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {status === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Subscribe'
              )}
            </button>
            
            {status === 'error' && (
              <p className="text-red-400 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    );
  }

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className={`bg-black border border-gray-800 rounded-2xl p-6 ${className}`}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-black" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Stay in the Loop
          </h3>
          <p className="text-gray-400 text-sm">
            Get the latest NFL insights, breaking news, and exclusive analysis delivered weekly to your inbox.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-green-400 mb-4">{message}</p>
            <button
              onClick={resetStatus}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Subscribe another email →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status !== 'idle') resetStatus();
              }}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
              disabled={status === 'loading'}
            />
            
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Subscribe Now
                </>
              )}
            </button>
            
            {status === 'error' && (
              <p className="text-red-400 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {message}
              </p>
            )}
            
            <p className="text-xs text-gray-500 text-center">
              No spam, unsubscribe at any time. We respect your privacy.
            </p>
          </form>
        )}
      </div>
    );
  }

  // Footer variant
  if (variant === 'footer') {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold text-white mb-4">
          Subscribe to The Game Snap
        </h3>
        <p className="text-gray-400 mb-6">
          Get weekly NFL insights and breaking news delivered to your inbox.
        </p>

        {status === 'success' ? (
          <div className="flex items-center text-green-400">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status !== 'idle') resetStatus();
              }}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none transition-colors"
              disabled={status === 'loading'}
            />
            
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
            >
              {status === 'loading' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Subscribe'
              )}
            </button>
          </form>
        )}
        
        {status === 'error' && (
          <p className="text-red-400 text-sm mt-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {message}
          </p>
        )}
      </div>
    );
  }

  // Default variant - full section
  return (
    <section className={`py-16 px-6 lg:px-8 bg-black ${className}`}>
      <div className="mx-auto max-w-4xl text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8">
          <Mail className="w-10 h-10 text-gray-900" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Never Miss a Snap
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Join thousands of NFL fans who get our exclusive analysis, breaking news, and insider insights delivered straight to their inbox every week.
        </p>

        {status === 'success' ? (
          <div className="bg-green-900/30 border border-green-500/50 rounded-2xl p-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Welcome to the Team!</h3>
            <p className="text-green-300 mb-6">{message}</p>
            <button
              onClick={resetStatus}
              className="text-green-400 hover:text-white transition-colors"
            >
              Subscribe another email →
            </button>
          </div>
        ) : (
          <div className="bg-black border border-gray-800 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status !== 'idle') resetStatus();
                }}
                placeholder="Enter your email address"
                className="flex-1 px-6 py-4 bg-gray-800 text-white rounded-xl border border-gray-600 focus:border-white focus:outline-none transition-colors text-lg"
                disabled={status === 'loading'}
              />
              
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center text-lg"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Subscribing...
                  </>
                ) : (
                  'Subscribe Free'
                )}
              </button>
            </form>
            
            {status === 'error' && (
              <p className="text-red-400 mt-4 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {message}
              </p>
            )}
            
            <p className="text-sm text-gray-400 mt-6">
              ✓ Weekly NFL insights &nbsp; ✓ Breaking news alerts &nbsp; ✓ Exclusive analysis &nbsp; ✓ No spam, ever
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
