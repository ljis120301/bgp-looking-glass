import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://bgp.whoisjason.me';
  
  // Common IP addresses to include
  const commonIPs = [
    // DNS Servers
    { ip: '1.1.1.1', name: 'Cloudflare DNS' },
    { ip: '8.8.8.8', name: 'Google DNS' },
    { ip: '9.9.9.9', name: 'Quad9 DNS' },
    { ip: '208.67.222.222', name: 'OpenDNS' },
    // CDNs
    { ip: '151.101.1.69', name: 'Fastly' },
    { ip: '104.18.32.1', name: 'Cloudflare' },
    // Major Services
    { ip: '13.107.246.10', name: 'Microsoft' },
    { ip: '142.250.190.78', name: 'Google' },
    { ip: '104.244.42.193', name: 'Twitter' },
    { ip: '31.13.72.36', name: 'Facebook' },
  ];

  // Base URL entry
  const baseEntry = {
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  };

  // IP-specific entries
  const ipEntries = commonIPs.map(({ ip, name }) => ({
    url: `${baseUrl}/${ip}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Additional static pages
  const staticPages = [
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  return [baseEntry, ...ipEntries, ...staticPages];
} 