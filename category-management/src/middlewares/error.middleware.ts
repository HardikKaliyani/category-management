import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response.util';
import logger from '../utils/logger';

export class HttpException extends Error {
    statusCode: number;
    errors?: any;

    constructor(message: string, statusCode: number, errors?: any) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
    }
}

export const errorMiddleware = (
    error: HttpException | Error,
    req: Request,
    res: Response,
    next: NextFunction
): Response => {
    // Log the error
    logger.error(`[Error] ${error.message}`, {
        path: req.path,
        method: req.method,
        stack: error.stack,
        body: req.body
    });

    // Handle known errors (HttpException)
    if (error instanceof HttpException) {
        return ResponseUtil.error(
            res,
            error.message,
            error.statusCode,
            error.errors
        );
    }

    // Handle Mongoose duplicate key error
    if (error.name === 'MongoServerError' && (error as any).code === 11000) {
        return ResponseUtil.error(
            res,
            'Duplicate key error',
            409,
            (error as any).keyValue
        );
    }

    // Handle Mongoose validation error
    if (error.name === 'ValidationError') {
        return ResponseUtil.error(
            res,
            'Validation error',
            400,
            error
        );
    }

    // Handle unknown errors
    return ResponseUtil.error(
        res,
        'Internal server error',
        500
    );
};