import path from "node:path";
import { fileURLToPath } from "node:url";
import { rm, cp, mkdir } from "node:fs/promises";
import { execSync } from "node:child_process";

const root = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(root, "dist");

console.log("🚀 Building Banque Mondiale for Plesk...\n");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

// 1. Build React frontend
console.log("📦 Building frontend...");
execSync("pnpm --filter @workspace/bank-mondial run build", {
  stdio: "inherit",
  cwd: root,
});
const frontendBuild = path.resolve(root, "artifacts/bank-mondial/dist/public");
const frontendDest = path.resolve(distDir, "public");
await cp(frontendBuild, frontendDest, { recursive: true });
console.log("✅ Frontend built → dist/public\n");

// 2. Build Express backend as CJS (runs inside api-server where esbuild is installed)
console.log("📦 Building backend...");
execSync("pnpm --filter @workspace/api-server run build:plesk", {
  stdio: "inherit",
  cwd: root,
});

console.log("\n✅ Plesk build complete!");
console.log("   dist/index.cjs  — startup file (set this in Plesk)");
console.log("   dist/public/    — React frontend (served automatically)");
