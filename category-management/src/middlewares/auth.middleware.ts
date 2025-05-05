import { Request, Response, NextFunction } from 'express';
import jwtUtil from '../utils/jwt.util';
import { ResponseUtil } from '../utils/response.util';
import { User } from '../models/user.model';

// Extend Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: any;
            userId?: string;
        }
    }
}

export class AuthMiddleware {
    /**
     * Authenticate request using JWT token
     */
    public static async authenticate(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
        try {
            // Get token from Authorization header
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return ResponseUtil.error(res, 'Access denied. No token provided', 401);
            }

            // Extract token
            const token = authHeader.split(' ')[1];

            // Verify token
            const decoded = jwtUtil.verifyToken(token);

            if (!decoded) {
                return ResponseUtil.error(res, 'Invalid or expired token', 401);
            }

            // Check if user exists
            const user = await User.findById(decoded.userId).select('-password');

            if (!user) {
                return ResponseUtil.error(res, 'User not found', 404);
            }

            // Attach user to request object
            req.user = user;
            req.userId = decoded.userId;

            next();
        } catch (error) {
            return ResponseUtil.error(res, 'Authentication failed', 401);
        }
    }
}

export default AuthMiddleware.authenticate;