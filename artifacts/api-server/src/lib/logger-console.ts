const level = process.env.LOG_LEVEL ?? "info";

function fmt(obj: Record<string, unknown> | string, msg?: string): string {
  const timestamp = new Date().toISOString();
  if (typeof obj === "string") return `[${timestamp}] ${obj}`;
  const { err, ...rest } = obj as any;
  const parts = [`[${timestamp}]`];
  if (msg) parts.push(msg);
  if (Object.keys(rest).length) parts.push(JSON.stringify(rest));
  if (err) parts.push(err?.stack ?? String(err));
  return parts.join(" ");
}

export const logger = {
  info: (obj: Record<string, unknown> | string, msg?: string) => console.log(fmt(obj, msg)),
  warn: (obj: Record<string, unknown> | string, msg?: string) => console.warn(fmt(obj, msg)),
  error: (obj: Record<string, unknown> | string, msg?: string) => console.error(fmt(obj, msg)),
  debug: (obj: Record<string, unknown> | string, msg?: string) => {
    if (level === "debug") console.log("[debug]", fmt(obj, msg));
  },
  child: () => logger,
};
