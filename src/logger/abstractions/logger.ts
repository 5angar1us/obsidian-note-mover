import type { ILogger } from "./ilogger";
import type { ErrorLevel } from "../consts/errorLevel";
import { CustomError } from "./CustomError";

export abstract class Logger implements ILogger {
	abstract logError(msg: string, stack?: string, originalError?: Error): void;

	abstract logMessage(msg: string, stack?: string, originalError?: Error): void;

	abstract logWarning(msg: string, stack?: string, originalError?: Error): void;

	protected formatOutputString(error: CustomError): string {
		// Just return the basic message without stack trace, as we'll pass the error object separately
		return `NoteMover: (${error.level}) ${error.message}`;
	}

	protected getError(
		message: string,
		level: ErrorLevel,
		stack?: string,
		originalError?: Error
	): CustomError {
		return { 
			message, 
			level, 
			time: Date.now(),
			stack,
			originalError
		};
	}
}