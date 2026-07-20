/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.s3.amazonaws.com" }],
  },
  // Silences "Next.js inferred your workspace root, but it may not be
  // correct" — Turbopack (default bundler as of Next.js 16) walks up
  // looking for lockfiles to guess the workspace root, and picks the
  // wrong one if it finds another lockfile above this project (common
  // when this repo sits inside another folder that itself has a
  // package-lock.json/yarn.lock/pnpm-lock.yaml). Pinning it explicitly
  // to this directory avoids the misdetection entirely rather than just
  // silencing the warning text.
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
