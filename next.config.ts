import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      'utf-8-validate': 'utf-8-validate',
      'bufferutil': 'bufferutil',
    },
  },
};

export default nextConfig;
