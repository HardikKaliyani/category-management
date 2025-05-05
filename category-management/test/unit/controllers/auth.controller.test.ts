import { Request, Response, NextFunction } from 'express';
import AuthController from '../../../src/controllers/auth.controller';
import authService from '../../../src/services/auth.service';
import { ResponseUtil } from '../../../src/utils/response.util';
import { HttpException } from '../../../src/middlewares/error.middleware';

// Mock dependencies
jest.mock('../../../src/services/auth.service');
jest.mock('../../../src/utils/response.util');

describe('AuthController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        mockRequest = {
            body: {},
            userId: 'mockUserId',
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockNext = jest.fn();

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            // Arrange
            const mockUserData = {
                name: 'John Doe',
                email: 'john@gmail.com',
                password: 'Password123'
            };

            const mockResult = {
                token: 'mockToken',
                user: {
                    id: 'mockUserId',
                    name: 'John Doe',
                    email: 'john@gmail.com'
                }
            };

            mockRequest.body = mockUserData;
            (authService.register as jest.Mock).mockResolvedValue(mockResult);

            // Act
            await AuthController.register(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(authService.register).toHaveBeenCalledWith(mockUserData);
            expect(ResponseUtil.success).toHaveBeenCalledWith(
                mockResponse,
                mockResult,
                'User registered successfully',
                201
            );
        });

        it('should handle registration error', async () => {
            // Arrange
            const mockError = new HttpException('Registration failed', 400);
            (authService.register as jest.Mock).mockRejectedValue(mockError);

            // Act
            await AuthController.register(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('login', () => {
        it('should login user successfully', async () => {
            // Arrange
            const mockLoginData = {
                email: 'john@gmail.com',
                password: 'Password123'
            };

            const mockResult = {
                token: 'mockToken',
                user: {
                    id: 'mockUserId',
                    name: 'John Doe',
                    email: 'john@gmail.com'
                }
            };

            mockRequest.body = mockLoginData;
            (authService.login as jest.Mock).mockResolvedValue(mockResult);

            // Act
            await AuthController.login(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(authService.login).toHaveBeenCalledWith(mockLoginData);
            expect(ResponseUtil.success).toHaveBeenCalledWith(
                mockResponse,
                mockResult,
                'Login successful'
            );
        });

        it('should handle login error', async () => {
            // Arrange
            const mockError = new HttpException('Invalid credentials', 401);
            (authService.login as jest.Mock).mockRejectedValue(mockError);

            // Act
            await AuthController.login(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('getCurrentUser', () => {
        it('should get current user successfully', async () => {
            // Arrange
            const mockUser = {
                _id: 'mockUserId',
                name: 'John Doe',
                email: 'john@gmail.com'
            };

            (authService.getUserById as jest.Mock).mockResolvedValue(mockUser);

            // Act
            await AuthController.getCurrentUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(authService.getUserById).toHaveBeenCalledWith('mockUserId');
            expect(ResponseUtil.success).toHaveBeenCalledWith(
                mockResponse,
                mockUser,
                'User retrieved successfully'
            );
        });

        it('should handle missing userId', async () => {
            // Arrange
            mockRequest.userId = undefined;

            // Act
            await AuthController.getCurrentUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(ResponseUtil.error).toHaveBeenCalledWith(
                mockResponse,
                'User ID not found in request',
                401
            );
        });

        it('should handle error when getting current user', async () => {
            // Arrange
            const mockError = new HttpException('User not found', 404);
            (authService.getUserById as jest.Mock).mockRejectedValue(mockError);

            // Act
            await AuthController.getCurrentUser(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
});