'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <div className="shell" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: 400, textAlign: 'center' }}>
        <AlertTriangle size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
        <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: 16 }}>Something went wrong</h2>
        <p className="muted" style={{ marginBottom: 24, fontSize: '0.9375rem' }}>
          {error?.message || "An unexpected error occurred. Our team has been notified."}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => reset()}
          style={{ width: '100%' }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
