import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "..", "uploads");

const app: Express = express();

app.use("/uploads", express.static(uploadsDir));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err, "Unhandled error");
  const status = err?.status ?? err?.statusCode ?? 500;
  res.status(status).json({ error: err?.message ?? "Erreur serveur interne" });
});

export default app;
