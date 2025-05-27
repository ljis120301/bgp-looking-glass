"use client";

import { useParams } from 'next/navigation';
import BGPLookupTool from '../components/BGPLookupTool';
import Script from 'next/script';

export default function IPPage() {
  const params = useParams();
  const ip = params.ip as string;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `BGP Routes for ${ip}`,
    "description": `View BGP routing information and network paths for IP address ${ip}.`,
    "url": `https://bgp.whoisjason.me/${ip}`,
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "BGP Looking Glass",
      "applicationCategory": "NetworkTool",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  };
  
  return (
    <>
      <Script
        id="ip-page-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BGPLookupTool />
    </>
  );
} 