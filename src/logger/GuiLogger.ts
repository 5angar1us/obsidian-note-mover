import { Notice } from "obsidian";
import { Logger } from "./abstractions/logger";
import { ErrorLevel } from "./consts/errorLevel";
import NoteMover from "src/main";


export class GuiLogger extends Logger {
	constructor(private plugin: NoteMover) {
		super();
	}

	logError(msg: string, stack?: string, originalError?: Error): void {
		const error = this.getError(msg, ErrorLevel.Error, stack, originalError);
		new Notice(this.formatOutputString(error), 15000);
	}

	logWarning(msg: string, stack?: string, originalError?: Error): void {
		const warning = this.getError(msg, ErrorLevel.Warning, stack, originalError);
		new Notice(this.formatOutputString(warning));
	}

	logMessage(msg: string, stack?: string, originalError?: Error): void {}
}