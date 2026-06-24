import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfmake', 'pdfkit'],
};

const analyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default analyzer(nextConfig);
