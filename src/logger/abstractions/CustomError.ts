import { ErrorLevel } from "../consts/errorLevel";

export interface CustomError {
	message: string;
	level: ErrorLevel;
	time: number;
	stack?: string;
	originalError?: Error;
}