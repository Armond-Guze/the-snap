import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  transpilePackages: ['framer-motion'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/vi/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/headlines/:slug',
        destination: '/articles/:slug',
        permanent: true,
      },
      {
        source: '/headlines/:slug/',
        destination: '/articles/:slug',
        permanent: true,
      },
    ];
  },
  async headers() {
    const baseCsp = [
      "default-src 'self';",
      // Allow Sanity + Vercel analytics scripts everywhere to avoid blocks if headers fall back to baseCsp.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://core.sanity-cdn.com https://cdn.sanity.io https://*.sanity.build https://*.sanity.tools https://*.sanity.studio https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.googlesyndication.com https://securepubads.g.doubleclick.net https://va.vercel-scripts.com https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.accounts.com https://www.google.com https://*.google.com https://www.gstatic.com https://www.gstatic.com/recaptcha/ https://www.recaptcha.net https://recaptcha.net https://challenges.cloudflare.com https://platform.twitter.com;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "img-src 'self' data: blob: https://cdn.sanity.io https://img.youtube.com https://i.ytimg.com https://pagead2.googlesyndication.com https://www.gstatic.com https://www.gstatic.com/recaptcha/ https://www.google.com https://*.google.com https://lh3.googleusercontent.com https://img.clerk.com https://pbs.twimg.com https://abs.twimg.com;",
      "font-src 'self' https://fonts.gstatic.com;",
      "connect-src 'self' https://cdn.sanity.io https://*.sanity.io https://*.api.sanity.io https://*.sanity.build https://*.sanity.dev https://*.sanity.tools https://*.sanity.studio https://registry.npmjs.org https://*.google-analytics.com https://*.doubleclick.net https://vercel.live https://api.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.accounts.com https://www.google.com https://*.google.com https://www.gstatic.com https://www.gstatic.com/recaptcha/ https://www.recaptcha.net https://recaptcha.net https://challenges.cloudflare.com https://platform.twitter.com https://cdn.syndication.twimg.com https://syndication.twitter.com wss://*.sanity.io wss://*.sanity.dev wss://*.sanity.build wss://*.sanity.tools wss://*.sanity.studio;",
      "frame-src https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://vercel.live https://*.sanity.io https://*.sanity.build https://*.sanity.tools https://*.sanity.studio https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.accounts.com https://www.google.com https://*.google.com https://www.recaptcha.net https://recaptcha.net https://challenges.cloudflare.com https://platform.twitter.com https://syndication.twitter.com https://twitter.com https://x.com;",
      "worker-src 'self' blob:;",
      "media-src 'self';",
      "object-src 'none';",
      "base-uri 'self';",
      "form-action 'self';",
      "frame-ancestors 'self';",
      "upgrade-insecure-requests;",
    ].join(' ');

    // Sanity Studio needs its own CSP so the studio bridge, CDN assets, and API calls are allowed.
    const studioCsp = [
      "default-src 'self';",
      // Sanity Studio injects helper iframes/scripts from *.sanity.build/.tools/.studio and uses blob workers.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://core.sanity-cdn.com https://cdn.sanity.io https://*.sanity.build https://*.sanity.tools https://*.sanity.studio https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.googlesyndication.com https://securepubads.g.doubleclick.net https://vercel.live https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.accounts.com https://www.google.com https://*.google.com https://www.gstatic.com https://www.gstatic.com/recaptcha/ https://www.recaptcha.net https://recaptcha.net https://challenges.cloudflare.com https://platform.twitter.com;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "img-src 'self' data: blob: https://cdn.sanity.io https://img.youtube.com https://i.ytimg.com https://pagead2.googlesyndication.com https://www.gstatic.com https://www.gstatic.com/recaptcha/ https://www.google.com https://*.google.com https://lh3.googleusercontent.com https://img.clerk.com https://pbs.twimg.com https://abs.twimg.com;",
      "font-src 'self' https://fonts.gstatic.com;",
      "connect-src 'self' https://cdn.sanity.io https://*.sanity.io https://*.api.sanity.io https://*.sanity.build https://*.sanity.dev https://*.sanity.tools https://*.sanity.studio https://registry.npmjs.org https://*.google-analytics.com https://*.doubleclick.net https://vercel.live https://api.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.accounts.com https://www.google.com https://*.google.com https://www.gstatic.com https://www.gstatic.com/recaptcha/ https://www.recaptcha.net https://recaptcha.net https://challenges.cloudflare.com https://platform.twitter.com https://cdn.syndication.twimg.com https://syndication.twitter.com wss://*.sanity.io wss://*.sanity.dev wss://*.sanity.build wss://*.sanity.tools wss://*.sanity.studio;",
      "frame-src https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://vercel.live https://*.sanity.io https://*.sanity.build https://*.sanity.tools https://*.sanity.studio https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.accounts.com https://www.google.com https://*.google.com https://www.recaptcha.net https://recaptcha.net https://challenges.cloudflare.com https://platform.twitter.com https://syndication.twitter.com https://twitter.com https://x.com;",
      "worker-src 'self' blob:;",
      "media-src 'self';",
      "object-src 'none';",
      "base-uri 'self';",
      "form-action 'self';",
      "frame-ancestors 'self';",
      "upgrade-insecure-requests;",
    ].join(' ');

    return [
      {
        source: '/studio/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: studioCsp },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=()' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: baseCsp },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=()' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
