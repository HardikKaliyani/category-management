import { Response } from 'express';

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: any;
}

export class ResponseUtil {
    /**
     * Send success response
     * @param res - Express response object
     * @param data - Data to send in response
     * @param message - Success message
     * @param statusCode - HTTP status code
     */
    public static success<T>(
        res: Response,
        data?: T,
        message: string = 'Operation successful',
        statusCode: number = 200
    ): Response {
        const response: ApiResponse<T> = {
            success: true,
            message,
            data
        };

        return res.status(statusCode).json(response);
    }

    /**
     * Send error response
     * @param res - Express response object
     * @param message - Error message
     * @param statusCode - HTTP status code
     * @param errors - Error details
     */
    public static error(
        res: Response,
        message: string = 'Operation failed',
        statusCode: number = 500,
        errors?: any
    ): Response {
        const response: ApiResponse<null> = {
            success: false,
            message,
            errors
        };

        return res.status(statusCode).json(response);
    }
}