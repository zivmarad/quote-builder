import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

/**
 * כותרות אבטחה. נבחרו כך שלא ישברו את האפליקציה:
 * - CSP מוגבל ל-frame-ancestors בלבד (אנטי-clickjacking) ולא חוסם סקריפטים/סגנונות.
 * - HSTS בטוח כי האתר מוגש ב-HTTPS (Vercel).
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
];

const nextConfig: NextConfig = {
  turbopack: {},
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN?.trim(),
  },
});
