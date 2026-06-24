import path from "path";
import express from "express";
import app from "./app";
import { logger } from "./lib/logger";

// In the bundled app.js, __dirname = the directory of app.js (i.e. /httpdocs)
// The React build is copied to /httpdocs/public/
const publicDir = path.join(__dirname, "public");

// Serve compiled React frontend static files (after /api routes mounted in app.ts)
app.use(express.static(publicDir));

// SPA fallback: every non-API, non-asset route serves index.html
app.get("*", (_req, res) => {
  res.sendFile("index.html", { root: publicDir });
});

const rawPort = process.env["PORT"] ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  logger.error("Invalid PORT value: " + rawPort);
  process.exit(1);
}

app.listen(port, () => {
  logger.info({ port }, "Banque Mondiale production server running");
});
