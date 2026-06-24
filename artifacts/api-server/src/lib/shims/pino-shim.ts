import { logger } from "../logger-console";

function pinoFactory(_opts?: any): typeof logger {
  return logger;
}
pinoFactory.stdSerializers = { req: (r: any) => r, res: (r: any) => r };
pinoFactory.destination = () => process.stdout;

export default pinoFactory;
export { pinoFactory as pino };
