"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-LK">
      <body style={{ fontFamily: "Helvetica, Arial, sans-serif", textAlign: "center", padding: "6rem 1rem", color: "#191919" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>Something went wrong</h1>
        <p style={{ marginTop: "1rem", color: "#5e5e5e" }}>Please try again in a moment.</p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: "2rem", padding: "0.875rem 1.5rem", background: "#000", color: "#fff", border: 0, borderRadius: 3, cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
