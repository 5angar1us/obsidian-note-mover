import type { ILogger } from "./abstractions/ilogger";
import type { ErrorLevel } from "./consts/errorLevel";
import { ErrorLevel as ErrorLevelEnum } from "./consts/errorLevel";
import { toError } from "src/ErrorOperations";


export class CompositeLogger {
	public static loggers: ILogger[] = [];

	public register(logger: ILogger): CompositeLogger {
		CompositeLogger.loggers.push(logger);

		return this;
	}

	logError(message: string | Error) {
		const messageStr = message instanceof Error ? message.message : message;
		const stack = message instanceof Error ? message.stack : undefined;
		const originalError = message instanceof Error ? message : undefined;
		
		CompositeLogger.loggers.forEach((logger) => logger.logError(messageStr, stack, originalError));
	}

	logWarning(message: string | Error) {
		const messageStr = message instanceof Error ? message.message : message;
		const stack = message instanceof Error ? message.stack : undefined;
		const originalError = message instanceof Error ? message : undefined;
		
		CompositeLogger.loggers.forEach((logger) => logger.logWarning(messageStr, stack, originalError));
	}

	logMessage(message: string | Error) {
		const messageStr = message instanceof Error ? message.message : message;
		const stack = message instanceof Error ? message.stack : undefined;
		const originalError = message instanceof Error ? message : undefined;
		
		CompositeLogger.loggers.forEach((logger) => logger.logMessage(messageStr, stack, originalError));
	}

	reportError(
		err: unknown, 
		contextMessage?: string,
		level: ErrorLevel = ErrorLevelEnum.Error
	  ): void {
		const error = toError(err, contextMessage);
		
		switch (level) {
		  case ErrorLevelEnum.Error:
			log.logError(error);
			break;
		  case ErrorLevelEnum.Warning:
			log.logWarning(error);
			break;
		  case ErrorLevelEnum.Log:
			log.logMessage(error);
			break;
		  default:
			// Ensure exhaustiveness
			log.logError(error);
		}
	  }
}

export const log = new CompositeLogger();