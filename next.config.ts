import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,

  images: {
    remotePatterns: [
      // Cloudinary holds every user-uploaded avatar, logo and resume preview.
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Backend-served media (legacy uploads still live behind the API).
      { protocol: 'https', hostname: 'api-prod.rateo.ng' },
      { protocol: 'https', hostname: 'api.rateo.ng' },
      // Clerk + Google avatars from social sign-in.
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  async headers() {
    // Both files are extensionless / must be served as JSON for iOS and
    // Android to accept them as app-link association files.
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ];
  },
};

export default nextConfig;
