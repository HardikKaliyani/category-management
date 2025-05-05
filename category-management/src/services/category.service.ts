import mongoose from 'mongoose';
import { Category, ICategory, CategoryStatus } from '../models/category.model';
import { HttpException } from '../middlewares/error.middleware';

export interface CategoryInput {
    name: string;
    parent?: string | null;
    status?: CategoryStatus;
}

export interface CategoryNode extends Omit<CategoryInput, 'parent'> {
    id: string;
    children: CategoryNode[];
}

export class CategoryService {
    /**
     * Create a new category
     * @param categoryData - Category data
     * @returns Created category
     */
    public async createCategory(categoryData: CategoryInput): Promise<ICategory> {
        // If parent is provided, check if it exists
        if (categoryData.parent) {
            const parentCategory = await Category.findById(categoryData.parent);

            if (!parentCategory) {
                throw new HttpException('Parent category not found', 404);
            }

            // If parent is inactive, child should also be inactive
            if (parentCategory.status === CategoryStatus.INACTIVE) {
                categoryData.status = CategoryStatus.INACTIVE;
            }
        }

        // Create and save category
        const category = new Category({
            name: categoryData.name,
            parent: categoryData.parent || null,
            status: categoryData.status || CategoryStatus.ACTIVE
        });

        await category.save();
        return category;
    }

    /**
     * Get all categories in tree structure
     * @returns Category tree
     */
    public async getCategoryTree(): Promise<CategoryNode[]> {
        // Get all categories
        const categories = await Category.find().sort('name').lean();

        // Map to create fast lookup
        const categoryMap = new Map<string, CategoryNode>();

        // Initialize the tree
        const rootCategories: CategoryNode[] = [];

        // First pass: Create all nodes
        categories.forEach(category => {
            const categoryNode: CategoryNode = {
                id: category._id.toString(),
                name: category.name,
                status: category.status,
                children: []
            };

            categoryMap.set(category._id.toString(), categoryNode);
        });

        // Second pass: Build tree
        categories.forEach(category => {
            const categoryId = category._id.toString();
            const categoryNode = categoryMap.get(categoryId);

            if (!categoryNode) return;

            if (category.parent) {
                const parentId = category.parent.toString();
                const parentNode = categoryMap.get(parentId);

                if (parentNode) {
                    parentNode.children.push(categoryNode);
                } else {
                    // If parent doesn't exist, treat as root
                    rootCategories.push(categoryNode);
                }
            } else {
                // Root category
                rootCategories.push(categoryNode);
            }
        });

        return rootCategories;
    }

    /**
     * Get category by ID
     * @param categoryId - Category ID
     * @returns Category document
     */
    public async getCategoryById(categoryId: string): Promise<ICategory> {
        const category = await Category.findById(categoryId);

        if (!category) {
            throw new HttpException('Category not found', 404);
        }

        return category;
    }

    /**
     * Update category
     * @param categoryId - Category ID
     * @param updateData - Category update data
     * @returns Updated category
     */
    public async updateCategory(categoryId: string, updateData: Partial<CategoryInput>): Promise<ICategory> {
        // Check if category exists
        await this.getCategoryById(categoryId);

        // Create update object
        const updateObj: any = {};

        // Update name if provided
        if (updateData.name) {
            updateObj.name = updateData.name;
        }

        // Update parent if provided
        if (updateData.parent) {
            // Set as root category
            updateObj.parent = null;
        } else {
            // Check if parent exists
            const parentCategory = await Category.findById(updateData.parent);

            if (!parentCategory) {
                throw new HttpException('Parent category not found', 404);
            }

            // Prevent circular references
            if (updateData.parent === categoryId) {
                throw new HttpException('Category cannot be its own parent', 400);
            }

            updateObj.parent = updateData.parent;

            // If parent is inactive, child should also be inactive
            if (parentCategory.status === CategoryStatus.INACTIVE) {
                updateObj.status = CategoryStatus.INACTIVE;
            }
        }


        // Update status if provided
        if (updateData.status) {
            updateObj.status = updateData.status;

            // If changing to inactive, update all children
            if (updateData.status === CategoryStatus.INACTIVE) {
                await this.updateChildrenStatus(categoryId, CategoryStatus.INACTIVE);
            }
        }

        // Update category
        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { $set: updateObj },
            { new: true }
        );

        if (!updatedCategory) {
            throw new HttpException('Category update failed', 500);
        }

        return updatedCategory;
    }

    /**
  * Delete category and reassign children to parent
  * @param categoryId - Category ID
  * @returns Success message
  */
    public async deleteCategory(categoryId: string): Promise<{ message: string }> {
        try {
            // Check if category exists
            const category = await this.getCategoryById(categoryId);

            // Get parent ID
            const parentId = category.parent;

            // Find children of the category
            const children = await Category.find({ parent: categoryId });

            // Update children to point to the parent of the deleted category
            await Category.updateMany(
                { parent: categoryId },
                { $set: { parent: parentId } }
            );

            // Delete the category
            await Category.findByIdAndDelete(categoryId);

            return {
                message: `Category deleted successfully. ${children.length} subcategories reassigned.`
            };
        } catch (error) {
            console.error('Error deleting category:', error);
            throw new HttpException('Failed to delete category', 500);
        }
    }

    /**
     * Update status of all child categories recursively
     * @param parentId - Parent category ID
     * @param status - Status to set
     * @private
     */
    private async updateChildrenStatus(parentId: string, status: CategoryStatus): Promise<void> {
        try {
            // Find all direct children
            const children = await Category.find({ parent: parentId });

            // Update status for all children
            await Category.updateMany(
                { parent: parentId },
                { $set: { status } }
            );

            // Recursively update grandchildren
            for (const child of children) {
                const childId = (child as any)._id?.toString();

                // Only proceed if we have a valid ID
                if (childId) {
                    await this.updateChildrenStatus(childId, status);
                }
            }
        } catch (error) {
            console.error('Error updating children status:', error);
            throw error;
        }
    }
}

export default new CategoryService();