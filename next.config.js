/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    // allow external profile images from Google (used by Firebase/GoogleAuth)
    domains: [
      "lh3.googleusercontent.com",
      "lh4.googleusercontent.com",
      "lh5.googleusercontent.com",
      "ui-avatars.com",
    ],
    // prefer remotePatterns for more flexibility; keep domains for backward compat
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.dicebear.com",
        pathname: "/api/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/api/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  // Development rewrite to proxy API requests to Quarkus to avoid CORS
  async rewrites() {
    return [
      {
        source: "/api/attendance/:path*",
        destination: "http://10.63.98.15:8080/api/attendance/:path*",
      },
      // Proxy auth and logbook endpoints so cookies set by backend are same-origin
      {
        source: "/api/auth/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL.replace(
              /\/$/,
              ""
            )}/api/auth/:path*`
          : "http://10.63.97.71:8080/api/auth/:path*",
      },
      {
        source: "/api/logbook/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL.replace(
              /\/$/,
              ""
            )}/api/logbook/:path*`
          : "http://10.63.97.71:8080/api/logbook/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
