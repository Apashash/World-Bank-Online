import { createRoot } from "react-dom/client";
import { Component, type ReactNode, type ErrorInfo } from "react";
import App from "./App";
import "./index.css";

const isModuleLoadError = (err: Error) =>
  err.message.includes("Importing a module") ||
  err.message.includes("Failed to fetch") ||
  err.message.includes("Loading chunk") ||
  err.message.includes("dynamically imported module");

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Root error boundary caught:", error, info);
    // Si c'est une erreur de chargement de module, recharger automatiquement
    // après 2 s (une seule fois, grâce au flag sessionStorage)
    if (isModuleLoadError(error)) {
      const reloaded = sessionStorage.getItem("__chunk_reload__");
      if (!reloaded) {
        sessionStorage.setItem("__chunk_reload__", "1");
        setTimeout(() => window.location.reload(), 2000);
      }
    }
  }

  render() {
    const { error } = this.state;
    if (error) {
      const isChunkError = isModuleLoadError(error);
      return (
        <div style={{
          padding: 32,
          fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif",
          fontSize: 14,
          color: "#111",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          gap: 16,
        }}>
          {isChunkError ? (
            <>
              <div style={{ fontSize: 40 }}>🔄</div>
              <strong style={{ fontSize: 18 }}>Mise à jour disponible</strong>
              <p style={{ color: "#6b7280", maxWidth: 300 }}>
                Une nouvelle version de l'application est disponible. Rechargez la page pour continuer.
              </p>
              <button
                onClick={() => { sessionStorage.removeItem("__chunk_reload__"); window.location.reload(); }}
                style={{
                  background: "#003087", color: "#fff", border: "none",
                  borderRadius: 10, padding: "12px 28px", fontSize: 15,
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                Recharger la page
              </button>
            </>
          ) : (
            <>
              <strong style={{ fontSize: 16 }}>Erreur de rendu</strong>
              <pre style={{
                marginTop: 12, whiteSpace: "pre-wrap", fontSize: 11,
                background: "#f3f4f6", padding: 12, borderRadius: 6,
                overflowX: "auto", maxWidth: "90vw", textAlign: "left",
              }}>
                {error.message}
              </pre>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "#003087", color: "#fff", border: "none",
                  borderRadius: 10, padding: "10px 24px", fontSize: 14,
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                Recharger
              </button>
            </>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root")!;
const loadingEl = document.getElementById("app-loading");

if (loadingEl) loadingEl.style.display = "none";

createRoot(rootEl).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
