"use client";

/** Last-resort error boundary — minimal because globals.css may not be loaded. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "Georgia, serif",
          background: "#faf8f3",
          color: "#1c1a16",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 22 }}>
            License<span style={{ color: "#a8330d" }}>Meter</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: "normal", marginTop: 24 }}>
            Something went wrong on our side.
          </h1>
          <p
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: 14,
              color: "#6b665d",
            }}
          >
            The error has been reported. Your data is unaffected.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 16,
              background: "#1c1a16",
              color: "#faf8f3",
              border: "none",
              padding: "12px 20px",
              fontFamily: "Arial, sans-serif",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
