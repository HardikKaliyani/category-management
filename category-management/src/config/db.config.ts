import mongoose from 'mongoose';
import { config } from './index';
import logger from '../utils/logger';

class Database {
    private static instance: Database;

    private constructor() { }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public async connect(): Promise<void> {
        try {
            const options = {
                autoIndex: true,  // Build indexes
                maxPoolSize: 10,   // Maintain up to 10 socket connections
                useNewUrlParser: true, useUnifiedTopology: true 
            };

            await mongoose.connect(config.mongodb.uri, options);
            logger.info('MongoDB successfully connected');
        } catch (error) {
            logger.error(`MongoDB connection error: ${error}`);
            process.exit(1);
        }
    }

    public async disconnect(): Promise<void> {
        try {
            await mongoose.disconnect();
            logger.info('MongoDB successfully disconnected');
        } catch (error) {
            logger.error(`MongoDB disconnection error: ${error}`);
        }
    }
}

export default Database.getInstance();