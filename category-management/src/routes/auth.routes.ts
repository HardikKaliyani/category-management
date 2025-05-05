import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { validate } from '../middlewares/validator.middleware';
import authenticate from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
    '/register',
    validate(AuthController.registerValidation),
    AuthController.register
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
    '/login',
    validate(AuthController.loginValidation),
    AuthController.login
);

/**
 * @route GET /api/auth/me
 * @desc Get current user information
 * @access Private
 */
router.get(
    '/me',
    authenticate,
    AuthController.getCurrentUser
);

export default router;