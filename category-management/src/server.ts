import app from './app';
import { config } from './config';
import logger from './utils/logger';
import database from './config/db.config';

// Connect to database
database.connect()
    .then(() => {
        // Start Express server
        const server = app.listen(config.port, () => {
            logger.info(`Server running at http://localhost:${config.port} in ${config.env} mode`);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err: Error) => {
            logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
            // Close server & exit process
            server.close(() => process.exit(1));
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (err: Error) => {
            logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
            // Close server & exit process
            server.close(() => process.exit(1));
        });

        // Handle termination signals
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, shutting down gracefully');
            server.close(() => {
                database.disconnect()
                    .then(() => {
                        logger.info('Process terminated');
                        process.exit(0);
                    });
            });
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT received, shutting down gracefully');
            server.close(() => {
                database.disconnect()
                    .then(() => {
                        logger.info('Process terminated');
                        process.exit(0);
                    });
            });
        });
    })
    .catch((err) => {
        logger.error(`Database connection error: ${err.message}`, { stack: err.stack });
        process.exit(1);
    });