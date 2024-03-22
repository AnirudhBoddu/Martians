const fs = require('fs');
const path = require('path');
const winston = require('winston');

module.exports = function(processName) {
    // Create a logs directory if it doesn't exist
    const logsDir = path.resolve(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }

    // Generate a timestamp for the log filename
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logFilePath = path.join(logsDir, `MartiansConversation-${processName}-${timestamp}.log`);

    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.json(),
            winston.format.printf(info => {
                return `${info.timestamp} [${info.level}] [${processName}]: ${info.message}`;
            })
        ),
        defaultMeta: { service: 'user-service' },
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }),
            new winston.transports.File({ filename: logFilePath }) // log to a file
        ]
    });

    return logger;
};