import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/sitemap.xml',
        '/manifest.json',
        '/api/bgp/*',
      ],
      disallow: [
        '/api/*',
        '/_next/*',
        '/static/*',
        '/private/*',
        '/*.json$',
        '/*.xml$',
        '/*.txt$',
      ],
    },
    sitemap: 'https://bgp.whoisjason.me/sitemap.xml',
    host: 'https://bgp.whoisjason.me',
  };
} 