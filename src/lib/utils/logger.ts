/**
 * Universal logging utility for client and server
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type Environment = 'development' | 'production';

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: Record<string, unknown>;
}

export interface LoggerConfig {
	minLevel?: LogLevel;
	enableTimestamps?: boolean;
	environment?: Environment;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3
};

/**
 * Logger class for structured logging with timestamps
 * Works in both client and server environments
 */
export class Logger {
	private context: Record<string, unknown>;
	private config: Required<LoggerConfig>;

	constructor(context: Record<string, unknown> = {}, config: LoggerConfig = {}) {
		this.context = context;
		this.config = {
			minLevel: config.minLevel ?? 'debug',
			enableTimestamps: config.enableTimestamps ?? true,
			environment: config.environment ?? this.detectEnvironment()
		};
	}

	/**
	 * Detects the current environment (client or server)
	 */
	private detectEnvironment(): Environment {
		if (typeof import.meta.env !== 'undefined') {
			return import.meta.env.DEV ? 'development' : 'production';
		}
		return 'development';
	}

	/**
	 * Determines if a log should be output based on level and environment
	 */
	private shouldLog(level: LogLevel): boolean {
		const levelPriority = LOG_LEVEL_PRIORITY[level];
		const minLevelPriority = LOG_LEVEL_PRIORITY[this.config.minLevel];

		if (levelPriority < minLevelPriority) {
			return false;
		}

		if (this.config.environment === 'production') {
			return level === 'warn' || level === 'error';
		}

		return true;
	}

	/**
	 * Creates a log entry with timestamp
	 */
	private createLogEntry(
		level: LogLevel,
		message: string,
		data?: Record<string, unknown>
	): LogEntry {
		return {
			timestamp: new Date().toISOString(),
			level,
			message,
			context: { ...this.context, ...data }
		};
	}

	/**
	 * Formats a log entry for output
	 */
	private formatLog(entry: LogEntry): string {
		const parts: string[] = [];

		if (this.config.enableTimestamps) {
			parts.push(`[${entry.timestamp}]`);
		}

		parts.push(`${entry.level.toUpperCase()}:`);
		parts.push(entry.message);

		if (entry.context && Object.keys(entry.context).length > 0) {
			parts.push(JSON.stringify(entry.context));
		}

		return parts.join(' ');
	}

	/**
	 * Logs a debug message
	 */
	debug(message: string, data?: Record<string, unknown>): void {
		if (!this.shouldLog('debug')) return;

		const entry = this.createLogEntry('debug', message, data);
		console.debug(this.formatLog(entry));
	}

	/**
	 * Logs an info message
	 */
	info(message: string, data?: Record<string, unknown>): void {
		if (!this.shouldLog('info')) return;

		const entry = this.createLogEntry('info', message, data);
		console.info(this.formatLog(entry));
	}

	/**
	 * Logs a warning message
	 */
	warn(message: string, data?: Record<string, unknown>): void {
		if (!this.shouldLog('warn')) return;

		const entry = this.createLogEntry('warn', message, data);
		console.warn(this.formatLog(entry));
	}

	/**
	 * Logs an error message
	 */
	error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
		if (!this.shouldLog('error')) return;

		const errorData: Record<string, unknown> = { ...data };

		if (error instanceof Error) {
			errorData.error = {
				name: error.name,
				message: error.message,
				stack: error.stack
			};
		} else if (error) {
			errorData.error = error;
		}

		const entry = this.createLogEntry('error', message, errorData);
		console.error(this.formatLog(entry));
	}

	/**
	 * Creates a child logger with additional context
	 */
	child(additionalContext: Record<string, unknown>): Logger {
		return new Logger({ ...this.context, ...additionalContext }, this.config);
	}

	/**
	 * Creates a logger scoped to a specific component
	 */
	static forComponent(componentName: string, config?: LoggerConfig): Logger {
		return new Logger({ component: componentName }, config);
	}

	/**
	 * Creates a logger scoped to a specific module
	 */
	static forModule(moduleName: string, config?: LoggerConfig): Logger {
		return new Logger({ module: moduleName }, config);
	}

	/**
	 * Creates a logger scoped to a specific route
	 */
	static forRoute(routePath: string, config?: LoggerConfig): Logger {
		return new Logger({ route: routePath }, config);
	}
}

/**
 * Default logger instance
 */
export const logger = new Logger();
