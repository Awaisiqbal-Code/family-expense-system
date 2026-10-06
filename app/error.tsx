'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-card border border-border shadow-premium">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          {error?.message || 'An unexpected application error occurred.'}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => reset()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Try Again</span>
          </Button>
          <Link href="/login">
            <Button variant="primary" size="sm">
              <Home className="w-3.5 h-3.5 mr-1.5" />
              <span>Go to Login</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
