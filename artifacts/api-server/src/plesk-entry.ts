import path from "path";
import express from "express";
import app from "./app";
import { logger } from "./lib/logger";

process.on("uncaughtException", (err) => {
  console.error("[plesk] Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[plesk] Unhandled rejection:", reason);
  process.exit(1);
});

// Validate required env vars at startup and log clearly
const requiredEnvVars = ["SUPABASE_DATABASE_URL", "DATABASE_URL"];
const hasDb = requiredEnvVars.some((k) => process.env[k]);
if (!hasDb) {
  console.error(
    "[plesk] ERROR: No database URL found.\n" +
    "  → Set SUPABASE_DATABASE_URL in Plesk → Custom environment variables\n" +
    "  → Value: your Supabase connection string\n" +
    "  → Then click 'Restart App'"
  );
}

const publicDir = path.join(__dirname, "public");

// Assets avec hash dans le nom → cache long terme (1 an)
app.use("/assets", express.static(path.join(publicDir, "assets"), {
  maxAge: "1y",
  immutable: true,
}));

// Tout le reste des fichiers statiques (images, favicon…) sans cache
app.use(express.static(publicDir, { maxAge: 0 }));

// SPA fallback : renvoyer index.html sans cache SAUF pour les assets (js/css/…)
// Si un chunk JS est manquant, renvoyer 404 propre au lieu de HTML
// (sinon le navigateur parse index.html comme JS → spinner infini)
app.get(/(.*)/, (req, res) => {
  if (/\.(js|mjs|css|wasm|json|map)$/.test(req.path)) {
    res.status(404).end();
    return;
  }
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile("index.html", { root: publicDir });
});

const rawPort = process.env["PORT"] ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  console.error("[plesk] Invalid PORT value: " + rawPort);
  process.exit(1);
}

app.listen(port, () => {
  logger.info({ port }, "Banque Mondiale production server running");
  console.log(`[plesk] Server listening on port ${port}`);
  console.log(`[plesk] Serving static files from: ${publicDir}`);
  console.log(`[plesk] DB URL configured: ${hasDb ? "YES ✓" : "NO ✗ — set env vars!"}`);
});
