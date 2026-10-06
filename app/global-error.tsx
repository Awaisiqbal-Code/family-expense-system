'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-center font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-200 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Application Error</h2>
          <p className="text-xs text-gray-600 mb-6">{error?.message || 'A critical error occurred.'}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
          >
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  );
}
