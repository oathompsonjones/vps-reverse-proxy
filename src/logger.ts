/* eslint-disable no-console */

/**
 * Formats a log message with a timestamp and log level.
 * @param level - The log level (e.g., "INFO", "WARN", "ERROR").
 * @param message - The log message to format.
 * @returns The formatted log message with a timestamp and log level.
 */
function formatMessage(level: string, message: string): string {
    return `${new Date().toISOString()} ${level}: ${message}`;
}

export default {
    error: (message: string): void => console.error(formatMessage("ERROR", message)),
    info: (message: string): void => console.log(formatMessage("INFO", message)),
    warn: (message: string): void => console.warn(formatMessage("WARN", message)),
};
