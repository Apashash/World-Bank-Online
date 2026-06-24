import type { Request, Response, NextFunction } from "express";

function pinoHttp(_opts?: any) {
  return function (_req: Request, _res: Response, next: NextFunction) {
    next();
  };
}

export default pinoHttp;
