import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/category-management'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret',
        expiresIn: '1h' // or 3600
    },
    logLevel: process.env.LOG_LEVEL || 'info'
};