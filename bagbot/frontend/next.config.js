/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Ensure server listens on all interfaces for Render
  experimental: {
    serverActions: {
      allowedOrigins: ['*.onrender.com'],
    },
  },
}

module.exports = nextConfig
