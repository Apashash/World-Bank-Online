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

app.use(express.static(publicDir));

app.get("*", (_req, res) => {
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
