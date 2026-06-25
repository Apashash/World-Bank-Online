import { createRoot } from "react-dom/client";
import { Component, type ReactNode, type ErrorInfo } from "react";
import App from "./App";
import "./index.css";

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Root error boundary caught:", error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div style={{
          padding: 24,
          fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif",
          fontSize: 14,
          color: "#111",
        }}>
          <strong style={{ fontSize: 16 }}>Erreur de rendu</strong>
          <pre style={{
            marginTop: 12,
            whiteSpace: "pre-wrap",
            fontSize: 12,
            background: "#f3f4f6",
            padding: 12,
            borderRadius: 6,
            overflowX: "auto",
          }}>
            {error.message}
            {"\n"}
            {error.stack}
          </pre>
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
