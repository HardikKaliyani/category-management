import { Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import categoryService from '../services/category.service';
import { ResponseUtil } from '../utils/response.util';
import { CategoryStatus } from '../models/category.model';

export class CategoryController {
    /**
     * Create category validation rules
     */
    public static createCategoryValidation = [
        body('name')
            .notEmpty().withMessage('Name is required')
            .isString().withMessage('Name must be a string')
            .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

        body('parent')
            .optional({ nullable: true })
            .isMongoId().withMessage('Parent ID must be a valid MongoDB ID'),

        body('status')
            .optional()
            .isIn(Object.values(CategoryStatus)).withMessage('Status must be active or inactive')
    ];

    /**
     * Update category validation rules
     */
    public static updateCategoryValidation = [
        param('id')
            .isMongoId().withMessage('Category ID must be a valid MongoDB ID'),

        body('name')
            .optional()
            .isString().withMessage('Name must be a string')
            .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

        body('parent')
            .optional({ nullable: true })
            .isMongoId().withMessage('Parent ID must be a valid MongoDB ID'),

        body('status')
            .optional()
            .isIn(Object.values(CategoryStatus)).withMessage('Status must be active or inactive')
    ];

    /**
     * Delete category validation rules
     */
    public static deleteCategoryValidation = [
        param('id')
            .isMongoId().withMessage('Category ID must be a valid MongoDB ID')
    ];

    /**
     * Create a new category
     */
    public static async createCategory(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const result = await categoryService.createCategory(req.body);
            return ResponseUtil.success(res, result, 'Category created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all categories in tree format
     */
    public static async getCategoryTree(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const result = await categoryService.getCategoryTree();
            return ResponseUtil.success(res, result, 'Categories retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get category by ID
     */
    public static async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const categoryId = req.params.id;
            const result = await categoryService.getCategoryById(categoryId);
            return ResponseUtil.success(res, result, 'Category retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update category
     */
    public static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const categoryId = req.params.id;
            const result = await categoryService.updateCategory(categoryId, req.body);
            return ResponseUtil.success(res, result, 'Category updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete category
     */
    public static async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const categoryId = req.params.id;
            const result = await categoryService.deleteCategory(categoryId);
            return ResponseUtil.success(res, result, 'Category deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

export default CategoryController;