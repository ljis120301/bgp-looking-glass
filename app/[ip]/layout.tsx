import { Metadata } from 'next';

type Props = {
  params: Promise<{ ip: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ip } = await params;
  
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

export default async function IPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 