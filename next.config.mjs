/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
