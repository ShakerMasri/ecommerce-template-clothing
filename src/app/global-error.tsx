"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "2rem",
            background: "#fafafa",
            color: "#09090b",
            fontFamily:
              'Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          <section
            role="alert"
            style={{
              width: "100%",
              maxWidth: "42rem",
              border: "1px solid #e4e4e7",
              borderRadius: "2rem",
              background: "#ffffff",
              padding: "2rem",
              boxShadow: "0 1px 3px rgb(0 0 0 / 0.08)",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#ea580c",
                fontSize: "0.875rem",
                fontWeight: 700,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
              }}
            >
              Something went wrong
            </p>
            <h1
              style={{
                margin: "0.75rem 0 0",
                fontSize: "2rem",
                lineHeight: 1.1,
                fontWeight: 900,
              }}
            >
              We could not load the store.
            </h1>
            <p
              style={{ margin: "1rem 0 0", color: "#52525b", lineHeight: 1.6 }}
            >
              Please try again. Technical details are hidden for security.
            </p>
            <div
              style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}
            >
              <button
                type="button"
                onClick={reset}
                style={{
                  border: 0,
                  borderRadius: "999px",
                  background: "#09090b",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 700,
                  padding: "0.75rem 1.25rem",
                }}
              >
                Try again
              </button>
              <a
                href="Link /"
                style={{
                  border: "1px solid #d4d4d8",
                  borderRadius: "999px",
                  color: "#09090b",
                  fontWeight: 700,
                  padding: "0.75rem 1.25rem",
                  textDecoration: "none",
                }}
              >
                Go home
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
