import { User, IUser } from '../models/user.model';
import jwtUtil from '../utils/jwt.util';
import { HttpException } from '../middlewares/error.middleware';

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

export class AuthService {
    /**
     * Register a new user
     * @param userData - User registration data
     * @returns AuthResponse with token and user data
     */
    public async register(userData: RegisterInput): Promise<AuthResponse> {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });

        if (existingUser) {
            throw new HttpException('User with this email already exists', 409);
        }

        // Create new user
        const user = new User(userData);
        await user.save();

        // Generate JWT token
        const token = jwtUtil.generateToken(user);

        return {
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email
            }
        };
    }

    /**
     * Login user
     * @param loginData - User login data
     * @returns AuthResponse with token and user data
     */
    public async login(loginData: LoginInput): Promise<AuthResponse> {
        // Find user by email
        const user = await User.findOne({ email: loginData.email });

        if (!user) {
            throw new HttpException('Invalid email or password', 401);
        }

        // Validate password
        const isPasswordValid = await user.comparePassword(loginData.password);

        if (!isPasswordValid) {
            throw new HttpException('Invalid email or password', 401);
        }

        // Generate JWT token
        const token = jwtUtil.generateToken(user);

        return {
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email
            }
        };
    }

    /**
     * Get user by ID
     * @param userId - User ID
     * @returns User document
     */
    public async getUserById(userId: string): Promise<IUser> {
        const user = await User.findById(userId).select('-password');

        if (!user) {
            throw new HttpException('User not found', 404);
        }

        return user;
    }
}

export default new AuthService();