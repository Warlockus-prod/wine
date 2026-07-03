"use client";

/**
 * Root error boundary — only fires when the ROOT layout itself throws, so it
 * must render its own <html>/<body>. Inline styles (no Tailwind context is
 * guaranteed here). Bilingual, minimal, branded.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pl">
      <body
        style={{
          margin: 0,
          background: "#0b1f44",
          color: "#f4efe9",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 1.5rem",
            gap: "1.25rem",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Coś poszło nie tak</h1>
          <p style={{ color: "#c9c2b4", maxWidth: "28rem", lineHeight: 1.6 }}>
            Przepraszamy — wystąpił błąd. Spróbuj ponownie.
            <br />
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              borderRadius: "999px",
              background: "#c79f69",
              color: "#0b1f44",
              border: "none",
              padding: "0.75rem 1.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Spróbuj ponownie / Try again
          </button>
        </div>
      </body>
    </html>
  );
}
