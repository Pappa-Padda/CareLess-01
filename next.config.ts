import type { NextConfig } from 'next'
 
const nextConfig: NextConfig = {
  turbopack: {
    // ...
  },
}

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public", // The folder where service worker files will be generated
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in development so it doesn't cache incorrectly while you code
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWA(nextConfig);