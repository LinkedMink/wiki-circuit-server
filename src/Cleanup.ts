import path from "path";
import { Logger } from "./Logger";

export type ExitFunction = () => number | Promise<number>;
const NoOpHandler: ExitFunction = () => 0;

export const executeOnExit = (handler = NoOpHandler): void => {
  const logger = Logger.get(path.basename(__filename));

  const wrappedHandler = (): void => {
    process.stdin.resume();
    const handlerResult = handler();
    if (handlerResult instanceof Promise) {
      handlerResult
        .then(result => process.exit(result))
        .catch(() => process.exit(1));
    } else {
      process.exit(handlerResult);
    }
  };

  process.on("exit", wrappedHandler);

  //do something when app is closing
  process.on("exit", wrappedHandler);

  //catches ctrl+c event
  process.on("SIGINT", wrappedHandler);

  // catches "kill pid" (for example: nodemon restart)
  process.on("SIGUSR1", wrappedHandler);
  process.on("SIGUSR2", wrappedHandler);

  process.on("uncaughtException", function (e) {
    logger.error("Uncaught Exception...");
    if (e.stack) {
      logger.error(e.stack);
    }

    process.exit(1);
  });
};
