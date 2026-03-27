/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "e-cdns-images.dzcdn.net",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "cdn-images.dzcdn.net",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "cdns-images.dzcdn.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.deezer.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
