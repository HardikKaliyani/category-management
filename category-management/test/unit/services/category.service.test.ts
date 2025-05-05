import mongoose from 'mongoose';
import { Category, CategoryStatus, ICategory } from '../../../src/models/category.model';
import categoryService from '../../../src/services/category.service';
import { HttpException } from '../../../src/middlewares/error.middleware';
import * as dbHandler from '../../integration/mongo-memory.server';

describe('CategoryService', () => {
    beforeAll(async () => {
        await dbHandler.connect();
    });

    afterEach(async () => {
        await dbHandler.clearDatabase();
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
    });

    describe('createCategory', () => {
        it('should create a root category successfully', async () => {
            const categoryData = {
                name: 'Root Category',
                status: CategoryStatus.ACTIVE
            };

            const category = await categoryService.createCategory(categoryData);

            expect(category).toBeTruthy();
            expect(category.name).toBe(categoryData.name);
            expect(category.status).toBe(categoryData.status);
            expect(category.parent).toBeNull();

            // Check if category was saved to database
            const savedCategory = await Category.findById(category._id);
            expect(savedCategory).toBeTruthy();
            if (savedCategory) { // Add null check for TypeScript
                expect(savedCategory.name).toBe(categoryData.name);
            }
        });

        it('should create a child category successfully', async () => {
            // Create parent category first
            const parentCategory = await categoryService.createCategory({
                name: 'Parent Category',
                status: CategoryStatus.ACTIVE
            });

            const parentId = parentCategory._id.toString();

            const childCategoryData = {
                name: 'Child Category',
                parent: parentId,
                status: CategoryStatus.ACTIVE
            };

            const childCategory = await categoryService.createCategory(childCategoryData);

            expect(childCategory).toBeTruthy();
            expect(childCategory.name).toBe(childCategoryData.name);
            expect(childCategory.status).toBe(childCategoryData.status);
            expect(childCategory.parent?.toString()).toBe(parentId);
        });

        it('should set child category as inactive if parent is inactive', async () => {
            // Create inactive parent category
            const parentCategory = await categoryService.createCategory({
                name: 'Inactive Parent',
                status: CategoryStatus.INACTIVE
            });

            const parentId = parentCategory._id.toString();

            const childCategoryData = {
                name: 'Child Category',
                parent: parentId,
                status: CategoryStatus.ACTIVE // Trying to set as active
            };

            const childCategory = await categoryService.createCategory(childCategoryData);

            // Child should be set to inactive regardless of passed status
            expect(childCategory.status).toBe(CategoryStatus.INACTIVE);
        });

        it('should throw error when parent category does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const categoryData = {
                name: 'Test Category',
                parent: nonExistentId
            };

            await expect(categoryService.createCategory(categoryData))
                .rejects
                .toThrow(HttpException);
        });
    });

    describe('getCategoryTree', () => {
        beforeEach(async () => {
            // Create a sample category hierarchy for testing
            const rootCategory = new Category({
                name: 'Root Category',
                status: CategoryStatus.ACTIVE
            });
            await rootCategory.save();

            const childCategory1 = new Category({
                name: 'Child Category 1',
                parent: rootCategory._id,
                status: CategoryStatus.ACTIVE
            });
            await childCategory1.save();

            const childCategory2 = new Category({
                name: 'Child Category 2',
                parent: rootCategory._id,
                status: CategoryStatus.INACTIVE
            });
            await childCategory2.save();

            const grandchildCategory = new Category({
                name: 'Grandchild Category',
                parent: childCategory1._id,
                status: CategoryStatus.ACTIVE
            });
            await grandchildCategory.save();
        });

        it('should retrieve category tree with correct hierarchy', async () => {
            const categoryTree = await categoryService.getCategoryTree();

            // Should have one root category
            expect(categoryTree.length).toBe(1);

            const rootNode = categoryTree[0];
            expect(rootNode.name).toBe('Root Category');

            // Root should have two children
            expect(rootNode.children.length).toBe(2);

            // Find Child Category 1
            const childNode1 = rootNode.children.find(c => c.name === 'Child Category 1');
            expect(childNode1).toBeTruthy();

            // Child Category 1 should have one child
            if (childNode1) { // Add null check for TypeScript
                expect(childNode1.children.length).toBe(1);
                expect(childNode1.children[0].name).toBe('Grandchild Category');
            }

            // Child Category 2 should have no children
            const childNode2 = rootNode.children.find(c => c.name === 'Child Category 2');
            expect(childNode2).toBeTruthy();
            if (childNode2) { // Add null check for TypeScript
                expect(childNode2.children.length).toBe(0);
            }
        });

        it('should return empty array when no categories exist', async () => {
            // Clear all categories
            await Category.deleteMany({});

            const categoryTree = await categoryService.getCategoryTree();
            expect(categoryTree).toEqual([]);
        });
    });

    describe('updateCategory', () => {
        let categoryId: string;

        beforeEach(async () => {
            // Create a category for update tests
            const category = await categoryService.createCategory({
                name: 'Original Category',
                status: CategoryStatus.ACTIVE
            });

            categoryId = category._id.toString();
        });

        it('should update category name successfully', async () => {
            const updateData = {
                name: 'Updated Category Name'
            };

            const updatedCategory = await categoryService.updateCategory(categoryId, updateData);

            expect(updatedCategory.name).toBe(updateData.name);
            expect(updatedCategory.status).toBe(CategoryStatus.ACTIVE); // Status should not change

            // Check database update
            const dbCategory = await Category.findById(categoryId);
            expect(dbCategory).toBeTruthy();
            if (dbCategory) { // Add null check for TypeScript
                expect(dbCategory.name).toBe(updateData.name);
            }
        });

        it('should update category status successfully', async () => {
            const updateData = {
                status: CategoryStatus.INACTIVE
            };

            const updatedCategory = await categoryService.updateCategory(categoryId, updateData);

            expect(updatedCategory.status).toBe(CategoryStatus.INACTIVE);
        });

        it('should update category parent successfully', async () => {
            // Create a new parent category
            const newParent = await categoryService.createCategory({
                name: 'New Parent Category'
            });

            const newParentId = newParent._id.toString();

            const updateData = {
                parent: newParentId
            };

            const updatedCategory = await categoryService.updateCategory(categoryId, updateData);

            expect(updatedCategory.parent?.toString()).toBe(newParentId);

            // Check database update
            const dbCategory = await Category.findById(categoryId);
            expect(dbCategory).toBeTruthy();
            if (dbCategory) { // Add null check for TypeScript
                expect(dbCategory.parent?.toString()).toBe(newParentId);
            }
        });

        it('should set parent to null when updating to root category', async () => {
            // First create a category with a parent
            const parent = await categoryService.createCategory({
                name: 'Parent Category'
            });

            const parentId = parent._id.toString();

            const childCategory = await categoryService.createCategory({
                name: 'Child Category',
                parent: parentId
            });

            const childId = childCategory._id.toString();

            // Now update to make it a root category
            const updateData = {
                parent: null
            };

            const updatedCategory = await categoryService.updateCategory(childId, updateData);

            expect(updatedCategory.parent).toBeNull();

            // Check database update
            const dbCategory = await Category.findById(childId);
            expect(dbCategory).toBeTruthy();
            if (dbCategory) { // Add null check for TypeScript
                expect(dbCategory.parent).toBeNull();
            }
        });

        it('should update status of all child categories when parent is set to inactive', async () => {
            // Create a parent with children
            const parent = await categoryService.createCategory({
                name: 'Parent Category',
                status: CategoryStatus.ACTIVE
            });

            const parentId = parent._id.toString();

            const child1 = await categoryService.createCategory({
                name: 'Child Category 1',
                parent: parentId,
                status: CategoryStatus.ACTIVE
            });

            const child1Id = child1._id.toString();

            const child2 = await categoryService.createCategory({
                name: 'Child Category 2',
                parent: parentId,
                status: CategoryStatus.ACTIVE
            });

            const child2Id = child2._id.toString();

            const grandchild = await categoryService.createCategory({
                name: 'Grandchild Category',
                parent: child1Id,
                status: CategoryStatus.ACTIVE
            });

            const grandchildId = grandchild._id.toString();

            // Update parent to inactive
            await categoryService.updateCategory(parentId, {
                status: CategoryStatus.INACTIVE
            });

            // Check if all children and grandchildren are now inactive
            const updatedChild1 = await Category.findById(child1Id);
            const updatedChild2 = await Category.findById(child2Id);
            const updatedGrandchild = await Category.findById(grandchildId);

            expect(updatedChild1?.status).toBe(CategoryStatus.INACTIVE);
            expect(updatedChild2?.status).toBe(CategoryStatus.INACTIVE);
            expect(updatedGrandchild?.status).toBe(CategoryStatus.INACTIVE);
        });

        it('should throw error when category does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            await expect(categoryService.updateCategory(nonExistentId, { name: 'New Name' }))
                .rejects
                .toThrow(HttpException);
        });

        it('should throw error when parent category does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            await expect(categoryService.updateCategory(categoryId, { parent: nonExistentId }))
                .rejects
                .toThrow(HttpException);
        });

        it('should throw error when setting category as its own parent', async () => {
            await expect(categoryService.updateCategory(categoryId, { parent: categoryId }))
                .rejects
                .toThrow(HttpException);
        });
    });

    describe('deleteCategory', () => {
        let rootId: string;
        let childId: string;
        let grandchildId: string;

        beforeEach(async () => {
            // Create a category hierarchy for deletion tests
            const root = await categoryService.createCategory({
                name: 'Root Category'
            });
            rootId = root._id.toString();

            const child = await categoryService.createCategory({
                name: 'Child Category',
                parent: rootId
            });
            childId = child._id.toString();

            const grandchild = await categoryService.createCategory({
                name: 'Grandchild Category',
                parent: childId
            });
            grandchildId = grandchild._id.toString();
        });

        it('should delete a leaf category successfully', async () => {
            const result = await categoryService.deleteCategory(grandchildId);

            expect(result).toHaveProperty('message');
            expect(result.message).toContain('Category deleted successfully');

            // Verify category is deleted
            const deletedCategory = await Category.findById(grandchildId);
            expect(deletedCategory).toBeNull();
        });

        it('should delete a middle category and reassign children to its parent', async () => {
            const result = await categoryService.deleteCategory(childId);

            expect(result).toHaveProperty('message');
            expect(result.message).toContain('Category deleted successfully');
            expect(result.message).toContain('1 subcategories reassigned');

            // Verify middle category is deleted
            const deletedCategory = await Category.findById(childId);
            expect(deletedCategory).toBeNull();

            // Verify grandchild is reassigned to root
            const reassignedGrandchild = await Category.findById(grandchildId);
            expect(reassignedGrandchild).toBeTruthy();
            if (reassignedGrandchild) { // Add null check for TypeScript
                expect(reassignedGrandchild.parent?.toString()).toBe(rootId);
            }
        });

        it('should delete a root category and make children as root categories', async () => {
            const result = await categoryService.deleteCategory(rootId);

            expect(result).toHaveProperty('message');

            // Verify root is deleted
            const deletedRoot = await Category.findById(rootId);
            expect(deletedRoot).toBeNull();

            // Verify child is now a root category
            const updatedChild = await Category.findById(childId);
            expect(updatedChild).toBeTruthy();
            if (updatedChild) { // Add null check for TypeScript
                expect(updatedChild.parent).toBeNull();
            }

            // Verify grandchild still points to child
            const updatedGrandchild = await Category.findById(grandchildId);
            expect(updatedGrandchild).toBeTruthy();
            if (updatedGrandchild) { // Add null check for TypeScript
                expect(updatedGrandchild.parent?.toString()).toBe(childId);
            }
        });

        it('should throw error when category does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            await expect(categoryService.deleteCategory(nonExistentId))
                .rejects
                .toThrow(HttpException);
        });
    });
});