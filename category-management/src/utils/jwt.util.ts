import jwt from 'jsonwebtoken';
import { config } from '../config';
import { IUser } from '../models/user.model';

export interface TokenPayload {
    userId: string;
    email: string;
}


class JwtService {
    /**
     * Generate JWT token
     * @param user - User document
     * @returns JWT token
     */
    public generateToken(user: IUser): string {
        const payload: TokenPayload = {
            userId: user._id.toString(),
            email: user.email
        };
        // @ts-ignore
        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn
        });
    }

    /**
     * Verify and decode JWT token
     * @param token - JWT token
     * @returns Decoded token payload or null if invalid
     */
    public verifyToken(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, config.jwt.secret) as TokenPayload;
        } catch (error) {
            return null;
        }
    }
}

export default new JwtService();