import { CacheLoggerAppender, ConsoleAppender } from './cache-logger-appender';

export enum LoggingLevel {
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 9
}

export class CacheLogger {

    private static readonly prefix = 'Cache >>> ';

    private static loggingLevel = LoggingLevel.ERROR;
    private static appender = new ConsoleAppender();

    public static info(message: string, ...args: any[]): void {
        if (this.loggingLevel <= LoggingLevel.INFO) {
            this.appender.info(this.prefix + message, args);
        }
    }

    public static warn(message: string, ...args: any[]): void {
        if (this.loggingLevel <= LoggingLevel.WARN) {
            this.appender.warn(this.prefix + message, args);
        }
    }

    public static error(message: string, ...args: any[]): void {
        if (this.loggingLevel <= LoggingLevel.ERROR) {
            this.appender.error(this.prefix + message, args);
        }
    }

    public static setLoggingLevel(loggingLevel: LoggingLevel): void {
        this.loggingLevel = loggingLevel;
    }

    public static setAppender(appender: CacheLoggerAppender): void {
        this.appender = appender;
    }

}

