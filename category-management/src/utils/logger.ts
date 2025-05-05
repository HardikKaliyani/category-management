import winston from 'winston';
import { config } from '../config';

const logger = winston.createLogger({
    level: config.logLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'category-management-api' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
                    return `[${timestamp}] ${service} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                })
            )
        })
    ]
});

// If in production, log to file as well
if (config.env === 'production') {
    logger.add(
        new winston.transports.File({
            filename: 'error.log',
            level: 'error'
        })
    );
    logger.add(
        new winston.transports.File({
            filename: 'combined.log'
        })
    );
}

export default logger;