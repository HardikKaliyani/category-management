import { Request, Response, NextFunction } from 'express';
import CategoryController from '../../../src/controllers/category.controller';
import categoryService from '../../../src/services/category.service';
import { ResponseUtil } from '../../../src/utils/response.util';
import { HttpException } from '../../../src/middlewares/error.middleware';
import { CategoryStatus } from '../../../src/models/category.model';

// Mock dependencies
jest.mock('../../../src/services/category.service');
jest.mock('../../../src/utils/response.util');

describe('CategoryController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
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

    describe('createCategory', () => {
        it('should create a category successfully', async () => {
            // Arrange
            const mockCategoryData = {
                name: 'Test Category',
                parent: null,
                status: CategoryStatus.ACTIVE
            };

            const mockResult = {
                _id: 'mockCategoryId',
                ...mockCategoryData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRequest.body = mockCategoryData;
            (categoryService.createCategory as jest.Mock).mockResolvedValue(mockResult);

            // Act
            await CategoryController.createCategory(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(categoryService.createCategory).toHaveBeenCalledWith(mockCategoryData);
            expect(ResponseUtil.success).toHaveBeenCalledWith(
                mockResponse,
                mockResult,
                'Category created successfully',
                201
            );
        });

        it('should handle category creation error', async () => {
            // Arrange
            const mockError = new HttpException('Category creation failed', 400);
            (categoryService.createCategory as jest.Mock).mockRejectedValue(mockError);

            // Act
            await CategoryController.createCategory(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('getCategoryTree', () => {
        it('should get category tree successfully', async () => {
            // Arrange
            const mockCategoryTree = [
                {
                    id: 'category1',
                    name: 'Category 1',
                    status: CategoryStatus.ACTIVE,
                    children: [
                        {
                            id: 'category2',
                            name: 'Category 2',
                            status: CategoryStatus.ACTIVE,
                            children: []
                        }
                    ]
                }
            ];

            (categoryService.getCategoryTree as jest.Mock).mockResolvedValue(mockCategoryTree);

            // Act
            await CategoryController.getCategoryTree(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(categoryService.getCategoryTree).toHaveBeenCalled();
            expect(ResponseUtil.success).toHaveBeenCalledWith(
                mockResponse,
                mockCategoryTree,
                'Categories retrieved successfully'
            );
        });

        it('should handle error when getting category tree', async () => {
            // Arrange
            const mockError = new Error('Failed to get category tree');
            (categoryService.getCategoryTree as jest.Mock).mockRejectedValue(mockError);

            // Act
            await CategoryController.getCategoryTree(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('getCategoryById', () => {
        it('should get category by ID successfully', async () => {
            // Arrange
            const categoryId = 'mockCategoryId';
            const mockCategory = {
                _id: categoryId,
                name: 'Test Category',
                parent: null,
                status: CategoryStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRequest.params = { id: categoryId };
            (categoryService.getCategoryById as jest.Mock).mockResolvedValue(mockCategory);

            // Act
            await CategoryController.getCategoryById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(categoryService.getCategoryById).toHaveBeenCalledWith(categoryId);
            expect(ResponseUtil.success).toHaveBeenCalledWith(
                mockResponse,
                mockCategory,
                'Category retrieved successfully'
            );
        });

        it('should handle error when getting category by ID', async () => {
            // Arrange
            const categoryId = 'mockCategoryId';
            const mockError = new HttpException('Category not found', 404);

            mockRequest.params = { id: categoryId };
            (categoryService.getCategoryById as jest.Mock).mockRejectedValue(mockError);

            // Act
            await CategoryController.getCategoryById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('updateCategory', () => {
        it('should update category successfully', async () => {
            // Arrange
            const categoryId = 'mockCategoryId';
            const updateData = {
                name: 'Updated Category',
                status: CategoryStatus.INACTIVE
            };

            const mockUpdatedCategory = {
                _id: categoryId,
                ...updateData,
                parent: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRequest.params = { id: categoryId };
            mockRequest.body = updateData;
            (categoryService.updateCategory as jest.Mock).mockResolvedValue(mockUpdatedCategory);

            // Act
            await CategoryController.updateCategory(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(categoryService.updateCategory).toHaveBeenCalledWith(categoryId, updateData);
            expect(ResponseUtil.success).toHaveBeenCalledWith(
                mockResponse,
                mockUpdatedCategory,
                'Category updated successfully'
            );
        });

        it('should handle error when updating category', async () => {
            // Arrange
            const categoryId = 'mockCategoryId';
            const mockError = new HttpException('Category update failed', 400);

            mockRequest.params = { id: categoryId };
            (categoryService.updateCategory as jest.Mock).mockRejectedValue(mockError);

            // Act
            await CategoryController.updateCategory(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('deleteCategory', () => {
        it('should delete category successfully', async () => {
            // Arrange
            const categoryId = 'mockCategoryId';
            const mockResult = {
                message: 'Category deleted successfully. 2 subcategories reassigned.'
            };

            mockRequest.params = { id: categoryId };
            (categoryService.deleteCategory as jest.Mock).mockResolvedValue(mockResult);

            // Act
            await CategoryController.deleteCategory(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(categoryService.deleteCategory).toHaveBeenCalledWith(categoryId);
            expect(ResponseUtil.success).toHaveBeenCalledWith(
                mockResponse,
                mockResult,
                'Category deleted successfully'
            );
        });

        it('should handle error when deleting category', async () => {
            // Arrange
            const categoryId = 'mockCategoryId';
            const mockError = new HttpException('Category deletion failed', 500);

            mockRequest.params = { id: categoryId };
            (categoryService.deleteCategory as jest.Mock).mockRejectedValue(mockError);

            // Act
            await CategoryController.deleteCategory(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
});