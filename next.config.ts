import withPWA from 'next-pwa';
import type { NextConfig } from 'next';
import path from 'path';

const securityHeaders = [
  { key: 'X-Frame-Options',              value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',       value: 'nosniff' },
  { key: 'X-XSS-Protection',             value: '1; mode=block' },
  { key: 'Referrer-Policy',              value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',           value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()' },
  { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin-allow-popups' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  { key: 'Strict-Transport-Security',    value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // External packages for server components (moved from experimental)
  // Exclude jsdom and parse5 from server bundle to avoid ESM/CommonJS conflicts
  serverExternalPackages: ['jsdom', 'parse5', 'isomorphic-dompurify'],
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'api.coffevista.ir',
        port: '8443',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  // Optimize for production
  // swcMinify is enabled by default in Next.js 15, no need to specify
  compress: true,
  poweredByHeader: false,
  // Webpack config to handle jsdom/parse5 ESM issues and uuid
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      // Exclude jsdom and parse5 from server bundle
      config.externals = config.externals || [];
      config.externals.push({
        'jsdom': 'commonjs jsdom',
        'parse5': 'commonjs parse5',
      });
    } else {
      // For client-side packages that expect Node built-ins
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'crypto': false,
        'stream': false,
        'buffer': false,
      };
      
      config.resolve.alias = {
        ...config.resolve.alias,
        'uuid': path.resolve(__dirname, 'node_modules/uuid/dist/index.js'),
        'uuid/dist/esm-browser/index.js': path.resolve(__dirname, 'node_modules/uuid/dist/index.js'),
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8080'}/api/v1/:path*`,
      },
    ];
  },
};

// PWA Configuration
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60
        }
      }
    },
    {
      urlPattern: /^https:\/\/(api\.coffevista\.ir|localhost).*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
  ]
});

export default pwaConfig(nextConfig as any);
