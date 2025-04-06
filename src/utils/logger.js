const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

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
      if (Object.prototype.hasOwnProperty.call(errorObj, key) && 
          !['message', 'stack'].includes(key)) {
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
  if (typeof info.error === 'string' && !info.stack && info instanceof Error) {
    info.stack = info.stack;
  }
  
  // Ensure all error logs have a timestamp
  if (info.level === 'error' && !info.timestamp) {
    info.timestamp = new Date().toISOString();
  }
  
  return info;
});

// Create Winston logger with console and file transports
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    errorFormatter(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'monitoring-poc-v2' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, error, stack, details, code, ...rest }) => {
          // Enhanced error formatting to display detailed error information
          let errorInfo = '';
          if (error) errorInfo += `\n  Error: ${error}`;
          if (code) errorInfo += `\n  Code: ${code}`;
          if (details) errorInfo += `\n  Details: ${details}`;
          if (stack) errorInfo += `\n  Stack: ${stack}`;
          
          const restString = Object.keys(rest).length ? 
            `\n${JSON.stringify(rest, null, 2)}` : '';
          return `${timestamp} ${level}: ${message}${errorInfo}${restString}`;
        })
      )
    }),
    
    // File transport for persistent logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Separate error log file
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add a stream for Morgan HTTP request logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger; 