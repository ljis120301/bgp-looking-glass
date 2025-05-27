import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found - BGP Looking Glass',
  description: 'The page you are looking for could not be found. Return to the BGP Looking Glass homepage to look up IP addresses and view BGP routing information.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100 p-4">
      <h1 className="text-4xl font-bold text-blue-400 mb-4">404 - Page Not Found</h1>
      <p className="text-gray-300 mb-8 text-center max-w-md">
        The page you are looking for could not be found. This might be because:
      </p>
      <ul className="list-disc list-inside text-gray-300 mb-8 space-y-2">
        <li>The IP address format is invalid</li>
        <li>The page has been moved or deleted</li>
        <li>The URL contains a typo</li>
      </ul>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
        >
          Return Home
        </Link>
        <Link 
          href="/about"
          className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-center"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
} 