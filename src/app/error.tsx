"use client";

// Root error boundary — catches any unhandled exception in a Server or
// Client Component below this point (excluding the root layout itself;
// see global-error.tsx for that case) and renders a recoverable screen
// instead of a blank page or a raw Next.js error overlay.
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-m20fog px-6 text-center">
      <h1 className="text-2xl font-semibold text-m20navy">Something went wrong</h1>
      <p className="max-w-md text-sm text-black/60">
        An unexpected error occurred loading this page. This has been logged; try again, or head back home.
      </p>
      {process.env.NODE_ENV !== "production" && (
        <pre className="mt-2 max-w-lg overflow-x-auto rounded-md bg-black/5 p-3 text-left text-xs text-black/50">
          {error.message}
        </pre>
      )}
      <div className="mt-2 flex gap-3">
        <button onClick={reset} className="rounded-md bg-m20navy px-4 py-2 text-sm font-medium text-white">
          Try again
        </button>
        <a href="/" className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium">Go home</a>
      </div>
    </div>
  );
}
