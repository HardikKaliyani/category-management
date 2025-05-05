import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import authService from '../services/auth.service';
import { ResponseUtil } from '../utils/response.util';

export class AuthController {
    /**
     * Register validation rules
     */
    public static registerValidation = [
        body('name')
            .notEmpty().withMessage('Name is required')
            .isString().withMessage('Name must be a string')
            .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

        body('email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Invalid email format'),

        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
            .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
            .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
            .matches(/[0-9]/).withMessage('Password must contain at least one number')
    ];

    /**
     * Login validation rules
     */
    public static loginValidation = [
        body('email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Invalid email format'),

        body('password')
            .notEmpty().withMessage('Password is required')
    ];

    /**
     * Register a new user
     */
    public static async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const result = await authService.register(req.body);
            return ResponseUtil.success(res, result, 'User registered successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login user
     */
    public static async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const result = await authService.login(req.body);
            return ResponseUtil.success(res, result, 'Login successful');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user information
     */
    public static async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            if (!req.userId) {
                return ResponseUtil.error(res, 'User ID not found in request', 401);
            }

            const user = await authService.getUserById(req.userId);
            return ResponseUtil.success(res, user, 'User retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

export default AuthController;