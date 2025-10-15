// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },

  // Correct location in Next 15
  outputFileTracingRoot: __dirname,

  // Prevent pdfjs from pulling native 'canvas' in prod
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      canvas: false,
    };
    return config;
  },
};

module.exports = nextConfig;
