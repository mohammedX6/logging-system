const winston = require("winston");
const LokiTransport = require("winston-loki");

// Custom format for better structuring error objects
const errorFormatter = winston.format((info) => {
  // If this log includes an Error object, properly extract all its properties
  if (info.error instanceof Error) {
    // Extract standard error properties
    const errorMessage = info.error.message;
    const errorStack = info.error.stack;

    // Extract custom error properties
    const errorObj = info.error;
    const customProps = {};

    // Collect all custom properties from the error object
    for (const key in errorObj) {
      if (
        Object.prototype.hasOwnProperty.call(errorObj, key) &&
        !["message", "stack"].includes(key)
      ) {
        customProps[key] = errorObj[key];
      }
    }

    // Set the extracted values directly on the info object
    info.error = errorMessage;
    info.stack = errorStack;

    // Add all custom properties to the log entry
    Object.assign(info, customProps);
  }

  // Handle case where error is provided as a string
  if (typeof info.error === "string" && !info.stack && info instanceof Error) {
    info.stack = info.stack;
  }

  // Ensure all error logs have a timestamp
  if (info.level === "error" && !info.timestamp) {
    info.timestamp = new Date().toISOString();
  }

  return info;
});

// Create Winston logger with console and Loki transports
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    errorFormatter(),
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: process.env.APP_NAME },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({
            timestamp,
            level,
            message,
            error,
            stack,
            details,
            code,
            ...rest
          }) => {
            // Enhanced error formatting to display detailed error information
            let errorInfo = "";
            if (error) errorInfo += `\n  Error: ${error}`;
            if (code) errorInfo += `\n  Code: ${code}`;
            if (details) errorInfo += `\n  Details: ${details}`;
            if (stack) errorInfo += `\n  Stack: ${stack}`;

            const restString = Object.keys(rest).length
              ? `\n${JSON.stringify(rest, null, 2)}`
              : "";
            return `${timestamp} ${level}: ${message}${errorInfo}${restString}`;
          }
        )
      ),
    }),

    // Loki transport for all logs
    new LokiTransport({
      host: process.env.LOKI_URL,
      labels: {
        job: "nodejs-app",
        environment: process.env.NODE_ENV,
        application: process.env.APP_NAME,
      },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => console.error("Loki connection error:", err),
    }),

    // Separate Loki transport for error logs
    new LokiTransport({
      host: process.env.LOKI_URL,
      labels: {
        job: "nodejs-app",
        environment: process.env.NODE_ENV,
        application: process.env.APP_NAME,
        log_type: "error",
      },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      level: "error",
      onConnectionError: (err) => console.error("Loki connection error:", err),
    }),
  ],
});

// Add a stream for Morgan HTTP request logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
