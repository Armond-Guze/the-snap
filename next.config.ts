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
  async headers() {
    const baseCsp = [
      "default-src 'self';",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.googlesyndication.com https://securepubads.g.doubleclick.net;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "img-src 'self' data: https://cdn.sanity.io https://img.youtube.com https://i.ytimg.com https://pagead2.googlesyndication.com;",
      "font-src 'self' https://fonts.gstatic.com;",
      "connect-src 'self' https://cdn.sanity.io https://*.google-analytics.com https://*.doubleclick.net;",
      "frame-src https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net;",
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://core.sanity-cdn.com https://cdn.sanity.io https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.googlesyndication.com https://securepubads.g.doubleclick.net https://vercel.live;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "img-src 'self' data: https://cdn.sanity.io https://img.youtube.com https://i.ytimg.com https://pagead2.googlesyndication.com;",
      "font-src 'self' https://fonts.gstatic.com;",
      "connect-src 'self' https://cdn.sanity.io https://*.sanity.io https://*.api.sanity.io https://*.google-analytics.com https://*.doubleclick.net https://vercel.live wss://*.sanity.io wss://*.sanity.dev;",
      "frame-src https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://vercel.live https://*.sanity.io;",
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