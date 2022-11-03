export interface CacheLoggerAppender {

    info(message: string, args: any[]): void;

    warn(message: string, args: any[]): void;

    error(message: string, args: any[]): void;

}

export class ConsoleAppender implements CacheLoggerAppender {

    error(message: string, args: any[]): void {
        console.log(message, ...args);
    }

    info(message: string, args: any[]): void {
        console.info(message, ...args);
    }

    warn(message: string, args: any[]): void {
        console.error(message, ...args);
    }

}
