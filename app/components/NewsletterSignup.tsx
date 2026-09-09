'use client';

import { useId, useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface NewsletterSignupProps {
  variant?: 'default' | 'compact' | 'sidebar' | 'footer';
  className?: string;
}

export default function NewsletterSignup({ 
  variant = 'default', 
  className = '' 
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const inputId = useId();
  const consentId = `${inputId}-consent`;
  const statusId = `${inputId}-status`;
  const emailInputProps = {
    id: inputId,
    name: 'email',
    autoComplete: 'email',
    inputMode: 'email' as const,
    required: true,
    'aria-describedby': status === 'idle' ? undefined : statusId,
    'aria-invalid': status === 'error',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }
    if (!consent) {
      setStatus('error');
      setMessage('Please agree to receive the newsletter');
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
        body: JSON.stringify({ email, consent: true }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to subscribe');
      }

      const data = await response.json();
      setStatus('success');
      const raw = (data && data.message) ? String(data.message) : '';
      setMessage(raw || 'If eligible, check your inbox to confirm your subscription.');
      setEmail('');
      setConsent(false);
    } catch (error: unknown) {
      setStatus('error');
      if (error instanceof Error) {
        setMessage(error.message === 'Failed to subscribe' ? 'Subscription failed. Try again later.' : error.message);
      } else {
        setMessage('Something went wrong. Please try again later.');
      }
    }
  };

  const resetStatus = () => {
    setStatus('idle');
    setMessage('');
  };

  const consentControl = (
    <label htmlFor={consentId} className="flex items-start gap-2 text-left text-xs leading-5 text-gray-400">
      <input
        id={consentId}
        name="consent"
        type="checkbox"
        value="true"
        checked={consent}
        onChange={(event) => {
          setConsent(event.target.checked);
          if (status !== 'idle') resetStatus();
        }}
        required
        className="mt-1 h-4 w-4 shrink-0 accent-white"
      />
      <span>
        I agree to receive The Snap newsletter by email. I can unsubscribe at any time. See the{' '}
        <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-white">
          privacy policy
        </Link>.
      </span>
    </label>
  );

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
            <p id={statusId} role="status" aria-live="polite" className="text-green-400 text-xs font-semibold">{message}</p>
          </div>
        ) : (
          <form action="/api/newsletter" method="post" onSubmit={handleSubmit} className="space-y-3">
            <input type="hidden" name="returnTo" value="/newsletter" />
            <label htmlFor={inputId} className="sr-only">Email address</label>
            <input
              {...emailInputProps}
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

            {consentControl}

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
              <p id={statusId} role="alert" className="text-red-400 text-xs flex items-center">
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
              <p id={statusId} role="status" aria-live="polite" className="text-green-400 mb-4 font-semibold">{message}</p>
            <button
              onClick={resetStatus}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Subscribe another email →
            </button>
          </div>
        ) : (
          <form action="/api/newsletter" method="post" onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="returnTo" value="/newsletter" />
            <label htmlFor={inputId} className="sr-only">Email address</label>
            <input
              {...emailInputProps}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status !== 'idle') resetStatus();
              }}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none transition-colors"
              disabled={status === 'loading'}
            />

            {consentControl}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full px-4 py-3 bg-gradient-to-r from-white to-gray-100 hover:from-gray-100 hover:to-gray-200 text-black font-medium rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center border border-gray-300"
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
              <p id={statusId} role="alert" className="text-red-400 text-sm flex items-center">
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
      <div className={`text-center ${className}`}>
        <h3 className="text-xl md:text-2xl font-extrabold text-white mb-4 uppercase tracking-widest">
          Never miss a snap
        </h3>
        <p className="text-gray-400 mb-6">
          Get weekly NFL insights and breaking news delivered to your inbox.
        </p>

        {status === 'success' ? (
          <div className="flex items-center text-green-400">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span id={statusId} role="status" aria-live="polite" className="font-semibold">{message}</span>
          </div>
        ) : (
          <form action="/api/newsletter" method="post" onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-3 mx-auto">
            <input type="hidden" name="returnTo" value="/newsletter" />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <label htmlFor={inputId} className="sr-only">Email address</label>
              <input
                {...emailInputProps}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status !== 'idle') resetStatus();
                }}
                placeholder="Enter your email"
                className="flex-1 min-w-[220px] px-4 py-3 bg-gray-800/80 text-white rounded-lg focus:outline-none transition-colors"
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
            </div>
            {consentControl}
          </form>
        )}
        
        {status === 'error' && (
          <p id={statusId} role="alert" className="text-red-400 text-sm mt-2 flex items-center">
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
          Join NFL fans who get our original analysis, rankings, and useful weekly updates delivered straight to their inbox.
        </p>

        {status === 'success' ? (
          <div className="bg-green-900/30 border border-green-500/50 rounded-2xl p-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 id={statusId} role="status" aria-live="polite" className="text-2xl font-bold text-white mb-2">{message}</h3>
              <p className="text-green-300 mb-6">Use the confirmation link in the email before you are added to the list.</p>
            <button
              onClick={resetStatus}
              className="text-green-400 hover:text-white transition-colors"
            >
              Subscribe another email →
            </button>
          </div>
        ) : (
          <div className="bg-black border border-gray-800 rounded-2xl p-8">
            <form action="/api/newsletter" method="post" onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4 mx-auto">
              <input type="hidden" name="returnTo" value="/newsletter" />
              <div className="flex flex-col gap-4 sm:flex-row">
                <label htmlFor={inputId} className="sr-only">Email address</label>
                <input
                  {...emailInputProps}
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
              </div>
              {consentControl}
            </form>
            
            {status === 'error' && (
              <p id={statusId} role="alert" className="text-red-400 mt-4 flex items-center justify-center">
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
