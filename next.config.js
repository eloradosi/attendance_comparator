/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Development rewrite to proxy API requests to Quarkus to avoid CORS
  async rewrites() {
    return [
      {
        source: "/api/attendance/:path*",
        destination: "http://10.63.98.15:8080/api/attendance/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
