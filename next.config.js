/** @type {import('next').NextConfig} */
const connectSrcValues = [
  "'self'",
  'https://*.supabase.co',
  'wss://*.supabase.co',
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  try {
    const { host, protocol } = new URL(supabaseUrl);
    connectSrcValues.push(`${protocol}//${host}`);
    connectSrcValues.push(`wss://${host}`);
  } catch (error) {
    console.warn('Invalid NEXT_PUBLIC_SUPABASE_URL for CSP:', error);
  }
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
if (redisUrl) {
  try {
    const { host, protocol } = new URL(redisUrl);
    connectSrcValues.push(`${protocol}//${host}`);
  } catch (error) {
    console.warn('Invalid UPSTASH_REDIS_REST_URL for CSP:', error);
  }
}

const connectSrc = connectSrcValues.join(' ');

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  media-src 'self' blob: data: https:;
  font-src 'self' data:;
  connect-src ${connectSrc};
  frame-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)',
  },
];

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.389346.ir.cdn.ir',
      },
      {
        protocol: 'https',
        hostname: 'coffevista.s3.ir-thr-at1.arvanstorage.ir',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/post/:id',
        destination: '/post/[id]',
      },
    ];
  },
};

module.exports = nextConfig; 