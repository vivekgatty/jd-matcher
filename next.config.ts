// next.config.ts
import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Make sure nothing tries to bundle node-canvas on the client
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      canvas: false, // hard-disable node-canvas
      fs: false,
      path: false,
    };

    // If anything asks for the legacy pdfjs build, redirect to the modern build
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "pdfjs-dist/legacy/build/pdf": "pdfjs-dist/build/pdf",
      "pdfjs-dist/legacy/build/pdf.worker": "pdfjs-dist/build/pdf.worker",
      canvas: false, // alias too, just in case
    };

    return config;
  },

  // Silences the “inferred workspace root” warning you saw
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
