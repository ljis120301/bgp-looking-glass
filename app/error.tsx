'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100 p-4">
      <h1 className="text-4xl font-bold text-red-400 mb-4">Something went wrong!</h1>
      <p className="text-gray-300 mb-8 text-center max-w-md">
        We apologize for the inconvenience. The application encountered an error while processing your request.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
        >
          Try Again
        </button>
        <Link 
          href="/"
          className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-center"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
} 