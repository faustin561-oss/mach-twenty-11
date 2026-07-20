"use client";

// Catches errors thrown by the root layout itself, which error.tsx cannot
// (error.tsx is rendered *inside* the layout, so a layout-level crash
// bypasses it). Must render its own <html>/<body> since the real layout
// failed. Rare in practice, but its absence is exactly how you get a
// truly blank white page with no way to recover.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "sans-serif", padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ maxWidth: 420, fontSize: 14, color: "#666" }}>
            The application failed to load. Try again, or reload the page.
          </p>
          <button onClick={reset} style={{ background: "#0B1F3A", color: "#fff", padding: "8px 16px", borderRadius: 6, border: "none", fontSize: 14 }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
