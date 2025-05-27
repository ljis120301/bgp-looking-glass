import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BodyAttributes from '@/components/BodyAttributes';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1F2937',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: {
    default: "BGP Looking Glass - Global BGP Route Visualization Tool",
    template: "%s | BGP Looking Glass"
  },
  description: "A powerful BGP Looking Glass tool that provides real-time visualization of global BGP routing information. Analyze network paths, BGP communities, and route collector data for any IP address.",
  keywords: ["BGP", "Looking Glass", "Network Routing", "IP Address", "BGP Communities", "Route Visualization", "Network Engineering", "Internet Routing", "ASN", "Autonomous System"],
  authors: [{ name: "Jason Graham", url: "https://whoisjason.me" }],
  creator: "Jason Graham",
  publisher: "Jason Graham",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bgp.whoisjason.me",
    title: "BGP Looking Glass - Global BGP Route Visualization Tool",
    description: "A powerful BGP Looking Glass tool that provides real-time visualization of global BGP routing information.",
    siteName: "BGP Looking Glass",
    images: [
      {
        url: "https://bgp.whoisjason.me/og-image.png",
        width: 1200,
        height: 630,
        alt: "BGP Looking Glass Preview",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BGP Looking Glass - Global BGP Route Visualization Tool",
    description: "A powerful BGP Looking Glass tool that provides real-time visualization of global BGP routing information.",
    creator: "@whoisjason",
    images: ["https://bgp.whoisjason.me/twitter-image.png"],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  alternates: {
    canonical: 'https://bgp.whoisjason.me',
  },
  category: 'networking',
  classification: 'utility',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'BGP Looking Glass',
    'application-name': 'BGP Looking Glass',
    'msapplication-TileColor': '#1F2937',
  },
  verification: {
    google: "your-google-site-verification", // Add your Google Search Console verification code
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "BGP Looking Glass",
    "description": "A powerful BGP Looking Glass tool that provides real-time visualization of global BGP routing information.",
    "applicationCategory": "NetworkTool",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Person",
      "name": "Jason Graham",
      "url": "https://whoisjason.me"
    },
    "url": "https://bgp.whoisjason.me",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://bgp.whoisjason.me?ip={ip}",
      "query-input": "required name=ip"
    },
    "featureList": [
      "Global BGP route visualization",
      "Real-time IP address lookup",
      "Worldwide route collector data",
      "BGP community interpretation",
      "Geographic distribution of routes"
    ],
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0.0",
    "softwareHelp": "https://bgp.whoisjason.me",
    "inLanguage": "en-US"
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <BodyAttributes />
        {/* Preconnect hints */}
        <link rel="preconnect" href="https://stat.ripe.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Resource hints */}
        <link rel="dns-prefetch" href="https://stat.ripe.net" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful');
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
