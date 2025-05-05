import { Router } from 'express';
import CategoryController from '../controllers/category.controller';
import { validate } from '../middlewares/validator.middleware';
import authenticate from '../middlewares/auth.middleware';

const router = Router();

/**
 * Apply authentication middleware to all routes
 */
router.use(authenticate);

/**
 * @route POST /api/category
 * @desc Create a new category
 * @access Private
 */
router.post(
    '/',
    validate(CategoryController.createCategoryValidation),
    CategoryController.createCategory
);

/**
 * @route GET /api/category
 * @desc Get all categories in tree format
 * @access Private
 */
router.get('/', CategoryController.getCategoryTree);

/**
 * @route GET /api/category/:id
 * @desc Get category by ID
 * @access Private
 */
router.get('/:id', CategoryController.getCategoryById);

/**
 * @route PUT /api/category/:id
 * @desc Update category
 * @access Private
 */
router.put(
    '/:id',
    validate(CategoryController.updateCategoryValidation),
    CategoryController.updateCategory
);

/**
 * @route DELETE /api/category/:id
 * @desc Delete category
 * @access Private
 */
router.delete(
    '/:id',
    validate(CategoryController.deleteCategoryValidation),
    CategoryController.deleteCategory
);

export default router;