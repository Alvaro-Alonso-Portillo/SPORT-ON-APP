
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // This allows the Next.js dev server to accept requests from a different
  // origin. This is necessary for the Studio preview iframe to work correctly.
  experimental: {},
  allowedDevOrigins: [
    'https://*.googleusercontent.com',
    'https://*.cloudworkstations.dev'
  ],
};

export default nextConfig;
