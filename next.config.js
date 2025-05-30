/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  webpack(config) {
    return config;
  },
};

module.exports = nextConfig; 