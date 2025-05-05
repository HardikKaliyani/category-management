import mongoose from 'mongoose';
import { User, IUser } from '../../../src/models/user.model';
import authService from '../../../src/services/auth.service';
import { HttpException } from '../../../src/middlewares/error.middleware';
import jwtUtil from '../../../src/utils/jwt.util';
import * as dbHandler from '../../integration/mongo-memory.server';

// Mock JWT util
jest.mock('../../../src/utils/jwt.util', () => ({
    generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
    verifyToken: jest.fn()
}));

describe('AuthService', () => {
    beforeAll(async () => {
        await dbHandler.connect();
    });

    afterEach(async () => {
        await dbHandler.clearDatabase();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
    });

    const userData = {
        name: 'John',
        email: 'john@gmail.com',
        password: 'Password123'
    };

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const result = await authService.register(userData);

            // Check response format
            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
            expect(result.user).toHaveProperty('id');
            expect(result.user.name).toBe(userData.name);
            expect(result.user.email).toBe(userData.email);

            // Check if JWT token was generated
            expect(jwtUtil.generateToken).toHaveBeenCalled();

            // Check if user was created in database
            const user = await User.findOne({ email: userData.email });
            expect(user).toBeTruthy();
            if (user) { // Add null check for TypeScript
                expect(user.name).toBe(userData.name);

                // Password should be hashed
                expect(user.password).not.toBe(userData.password);
            }
        });

        it('should throw error when email already exists', async () => {
            // First create a user
            await authService.register(userData);

            // Try to register with the same email
            await expect(authService.register(userData))
                .rejects
                .toThrow(HttpException);
        });
    });

    describe('login', () => {
        beforeEach(async () => {
            // Create a user for login tests
            await authService.register(userData);
        });

        it('should login user successfully with correct credentials', async () => {
            const loginData = {
                email: userData.email,
                password: userData.password
            };

            const result = await authService.login(loginData);

            // Check response format
            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
            expect(result.token).toBe('mock-jwt-token');
            expect(result.user.email).toBe(userData.email);

            // Check if JWT token was generated
            expect(jwtUtil.generateToken).toHaveBeenCalled();
        });

        it('should throw error when email does not exist', async () => {
            const loginData = {
                email: 'notexists@email.com',
                password: userData.password
            };

            await expect(authService.login(loginData))
                .rejects
                .toThrow(HttpException);
        });

        it('should throw error when password is incorrect', async () => {
            const loginData = {
                email: userData.email,
                password: 'WrongPassword123'
            };

            await expect(authService.login(loginData))
                .rejects
                .toThrow(HttpException);
        });
    });

    describe('getUserById', () => {
        let userId: string;

        beforeEach(async () => {
            // Create a user and get ID
            const { user } = await authService.register(userData);
            userId = user.id;
        });

        it('should get user by ID successfully', async () => {
            const user = await authService.getUserById(userId);

            expect(user).toBeTruthy();
            expect(user.name).toBe(userData.name);
            expect(user.email).toBe(userData.email);

            // Check if user doesn't have password property
            const userObj = user.toObject();
            expect(userObj).not.toHaveProperty('password');
        });

        it('should throw error when user does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            await expect(authService.getUserById(nonExistentId))
                .rejects
                .toThrow(HttpException);
        });
    });
});