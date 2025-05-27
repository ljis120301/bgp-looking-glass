import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { ip: string } }): Promise<Metadata> {
  const ip = params.ip;
  
  return {
    title: `BGP Routes for ${ip} - BGP Looking Glass`,
    description: `View BGP routing information and network paths for IP address ${ip}. Analyze how different networks around the world can reach this IP address.`,
    openGraph: {
      title: `BGP Routes for ${ip} - BGP Looking Glass`,
      description: `View BGP routing information and network paths for IP address ${ip}.`,
      url: `https://bgp.whoisjason.me/${ip}`,
    },
    twitter: {
      title: `BGP Routes for ${ip} - BGP Looking Glass`,
      description: `View BGP routing information and network paths for IP address ${ip}.`,
    },
    alternates: {
      canonical: `https://bgp.whoisjason.me/${ip}`,
    },
  };
}

export default function IPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 