import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { mkdir } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(artifactDir, "../..");
const distDir = path.resolve(rootDir, "dist");

await mkdir(distDir, { recursive: true });

await esbuild({
  entryPoints: { index: path.resolve(artifactDir, "src/plesk-entry.ts") },
  platform: "node",
  bundle: true,
  format: "cjs",
  outdir: distDir,
  outExtension: { ".js": ".cjs" },
  logLevel: "info",
  define: {
    "import.meta.url": "__cjs_import_meta_url__",
  },
  banner: {
    js: 'const __cjs_import_meta_url__ = require("url").pathToFileURL(__filename).href;',
  },
  // Replace pino + pino-http with simple console shims — worker threads
  // don't work reliably in Phusion Passenger environments.
  alias: {
    "pino": path.resolve(artifactDir, "src/lib/shims/pino-shim.ts"),
    "pino-http": path.resolve(artifactDir, "src/lib/shims/pino-http-shim.ts"),
  },
  external: [
    "*.node",
    "sharp",
    "better-sqlite3",
    "sqlite3",
    "canvas",
    "bcrypt",
    "argon2",
    "fsevents",
    "re2",
    "farmhash",
    "xxhash-addon",
    "bufferutil",
    "utf-8-validate",
    "ssh2",
    "cpu-features",
    "dtrace-provider",
    "isolated-vm",
    "lightningcss",
    "pg-native",
    "oracledb",
    "mongodb-client-encryption",
    "nodemailer",
    "handlebars",
    "knex",
    "typeorm",
    "protobufjs",
    "onnxruntime-node",
    "@tensorflow/*",
    "@prisma/client",
    "@mikro-orm/*",
    "@grpc/*",
    "@swc/*",
    "@aws-sdk/*",
    "@azure/*",
    "@opentelemetry/*",
    "@google-cloud/*",
    "@google/*",
    "googleapis",
    "firebase-admin",
    "@parcel/watcher",
    "@sentry/profiling-node",
    "@tree-sitter/*",
    "aws-sdk",
    "classic-level",
    "dd-trace",
    "ffi-napi",
    "grpc",
    "hiredis",
    "kerberos",
    "leveldown",
    "miniflare",
    "mysql2",
    "newrelic",
    "odbc",
    "piscina",
    "realm",
    "ref-napi",
    "rocksdb",
    "sass-embedded",
    "sequelize",
    "serialport",
    "snappy",
    "tinypool",
    "usb",
    "workerd",
    "wrangler",
    "zeromq",
    "zeromq-prebuilt",
    "playwright",
    "puppeteer",
    "puppeteer-core",
    "electron",
  ],
  sourcemap: "linked",
  // No esbuildPluginPino — pino is shimmed away entirely
});

console.log("✅ Backend built → dist/index.cjs");
