'use client';

/**
 * Route-level error boundary (Next App Router convention).
 *
 * 2026-08-30: before this file, any render error inside a dashboard page
 * unmounted the whole app into a blank screen with no recovery path.
 * Next.js automatically wraps every route segment with this boundary —
 * the user gets a readable message + retry button instead of a white page.
 */
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for debugging; wire to Sentry/OTel in the observability wave
    console.error('[Route error]', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: 16,
      }}
    >
      <div style={{ fontSize: 40 }}>⚠️</div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>
        Something went wrong on this page
      </h2>
      <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 420, textAlign: 'center' }}>
        {error.message || 'An unexpected error occurred while rendering this page.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '8px 20px',
          borderRadius: 10,
          border: 'none',
          background: '#2563eb',
          color: 'white',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}