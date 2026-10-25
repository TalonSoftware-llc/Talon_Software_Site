/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Throwaway prototype only. These packages are imported by /api/prototype/vercel
  // and do not belong in the marketing bundle (PGlite ships WASM).
  serverExternalPackages: ["@electric-sql/pglite", "@neondatabase/serverless"],
};

module.exports = nextConfig;
