import withPWA from 'next-pwa';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
    ignoreBuildErrors: false,
  },
  // Optimize for production
  // swcMinify is enabled by default in Next.js 15, no need to specify
  compress: true,
  poweredByHeader: false,
  // Webpack config to handle jsdom/parse5 ESM issues
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      // Exclude jsdom and parse5 from server bundle
      config.externals = config.externals || [];
      config.externals.push({
        'jsdom': 'commonjs jsdom',
        'parse5': 'commonjs parse5',
      });
    }
    return config;
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
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
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
