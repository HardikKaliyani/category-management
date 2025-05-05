import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ResponseUtil } from '../utils/response.util';

export const validate = (validations: ValidationChain[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        // Check for validation errors
        const errors = validationResult(req);

        if (errors.isEmpty()) {
            return next();
        }

        // Format errors and send response
        const formattedErrors = errors.array().reduce((acc: any, error: any) => {
            const field = error.path;
            if (!acc[field]) {
                acc[field] = [];
            }
            acc[field].push(error.msg);
            return acc;
        }, {});

        return ResponseUtil.error(
            res,
            'Validation error',
            400,
            formattedErrors
        );
    };
};