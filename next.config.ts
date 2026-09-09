import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
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
        source: '/categories/bengals',
        destination: '/teams/bengals',
        permanent: true,
      },
      {
        source: '/categories/giants-qb',
        destination: '/teams/giants',
        permanent: true,
      },
      {
        source: '/categories/dolphins',
        destination: '/teams/dolphins',
        permanent: true,
      },
      {
        source: '/rankings/top-10-nfl-players-of-the-2024-season',
        destination: '/articles',
        permanent: true,
      },
      {
        source: '/rankings',
        destination: '/articles',
        permanent: true,
      },
      {
        source: '/rankings/',
        destination: '/articles',
        permanent: true,
      },
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
      {
        source: '/articles/cowboys-charles-snowden-suspended-for-first-three-regular-season-games-nfl-com-roundup',
        destination: '/teams/dallas-cowboys',
        permanent: true,
      },
    ];
  },
  async headers() {
    const shouldUpgradeInsecureRequests = process.env.NODE_ENV === 'production';
    const baseCsp = [
      "default-src 'self';",
      "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.googlesyndication.com https://securepubads.g.doubleclick.net https://va.vercel-scripts.com https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.accounts.com https://clerk.thegamesnap.com https://www.google.com https://*.google.com https://www.gstatic.com https://www.gstatic.com/recaptcha/ https://www.recaptcha.net https://recaptcha.net https://challenges.cloudflare.com https://platform.twitter.com https://www.instagram.com https://www.tiktok.com;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "img-src 'self' data: blob: https://cdn.sanity.io https://img.youtube.com https://i.ytimg.com https://pagead2.googlesyndication.com https://www.gstatic.com https://www.gstatic.com/recaptcha/ https://www.google.com https://*.google.com https://lh3.googleusercontent.com https://img.clerk.com https://pbs.twimg.com https://abs.twimg.com https://*.cdninstagram.com https://*.fbcdn.net https://*.tiktokcdn.com;",
      "font-src 'self' https://fonts.gstatic.com;",
      "connect-src 'self' https://cdn.sanity.io https://*.api.sanity.io https://*.apicdn.sanity.io https://formspree.io https://*.google-analytics.com https://*.doubleclick.net https://vercel.live https://api.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.accounts.com https://clerk.thegamesnap.com https://www.google.com https://*.google.com https://www.gstatic.com https://www.gstatic.com/recaptcha/ https://www.recaptcha.net https://recaptcha.net https://challenges.cloudflare.com https://platform.twitter.com https://cdn.syndication.twimg.com https://syndication.twitter.com https://www.instagram.com https://www.tiktok.com;",
      "frame-src https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://vercel.live https://*.sanity.io https://*.sanity.build https://*.sanity.tools https://*.sanity.studio https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.accounts.com https://clerk.thegamesnap.com https://www.google.com https://*.google.com https://www.recaptcha.net https://recaptcha.net https://challenges.cloudflare.com https://platform.twitter.com https://syndication.twitter.com https://twitter.com https://x.com https://www.youtube.com https://www.youtube-nocookie.com https://www.instagram.com https://www.tiktok.com;",
      "worker-src 'self' blob:;",
      "media-src 'self';",
      "object-src 'none';",
      "base-uri 'self';",
      "form-action 'self' https://formspree.io;",
      "frame-ancestors 'self';",
      ...(shouldUpgradeInsecureRequests ? ["upgrade-insecure-requests;"] : []),
    ].join(' ');

    // Sanity Studio needs its own CSP so the studio bridge, CDN assets, and API calls are allowed.
    const studioCsp = [
      "default-src 'self';",
      // Sanity Studio injects helper iframes/scripts from *.sanity.build/.tools/.studio and uses blob workers.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://core.sanity-cdn.com https://cdn.sanity.io https://*.sanity.build https://*.sanity.tools https://*.sanity.studio https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.googlesyndication.com https://securepubads.g.doubleclick.net https://vercel.live https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.accounts.com https://clerk.thegamesnap.com https://www.google.com https://*.google.com https://www.gstatic.com https://www.gstatic.com/recaptcha/ https://www.recaptcha.net https://recaptcha.net https://challenges.cloudflare.com https://platform.twitter.com;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "img-src 'self' data: blob: https://cdn.sanity.io https://img.youtube.com https://i.ytimg.com https://pagead2.googlesyndication.com https://www.gstatic.com https://www.gstatic.com/recaptcha/ https://www.google.com https://*.google.com https://lh3.googleusercontent.com https://img.clerk.com https://pbs.twimg.com https://abs.twimg.com;",
      "font-src 'self' https://fonts.gstatic.com;",
      "connect-src 'self' https://cdn.sanity.io https://*.sanity.io https://*.api.sanity.io https://*.sanity.build https://*.sanity.dev https://*.sanity.tools https://*.sanity.studio https://registry.npmjs.org https://*.google-analytics.com https://*.doubleclick.net https://vercel.live https://api.clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.accounts.com https://clerk.thegamesnap.com https://www.google.com https://*.google.com https://www.gstatic.com https://www.gstatic.com/recaptcha/ https://www.recaptcha.net https://recaptcha.net https://challenges.cloudflare.com https://platform.twitter.com https://cdn.syndication.twimg.com https://syndication.twitter.com wss://*.sanity.io wss://*.sanity.dev wss://*.sanity.build wss://*.sanity.tools wss://*.sanity.studio;",
      "frame-src https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://vercel.live https://*.sanity.io https://*.sanity.build https://*.sanity.tools https://*.sanity.studio https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.accounts.com https://clerk.thegamesnap.com https://www.google.com https://*.google.com https://www.recaptcha.net https://recaptcha.net https://challenges.cloudflare.com https://platform.twitter.com https://syndication.twitter.com https://twitter.com https://x.com;",
      "worker-src 'self' blob:;",
      "media-src 'self';",
      "object-src 'none';",
      "base-uri 'self';",
      "form-action 'self';",
      "frame-ancestors 'self';",
      ...(shouldUpgradeInsecureRequests ? ["upgrade-insecure-requests;"] : []),
    ].join(' ');

    const securityHeaders = (contentSecurityPolicy: string) => [
      { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=()' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders(baseCsp),
      },
      // Keep the more-specific Studio rule last: Next.js lets the last
      // matching header value override earlier matches for the same key.
      {
        source: '/studio/:path*',
        headers: securityHeaders(studioCsp),
      },
    ];
  },
};

export default nextConfig;
