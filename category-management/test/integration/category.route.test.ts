import request from 'supertest';
import app from '../../src/app';
import * as dbHandler from './mongo-memory-server';
import { Category, CategoryStatus } from '../../src/models/category.model';
import mongoose from 'mongoose';

describe('Category Routes', () => {
    let authToken: string;

    beforeAll(async () => {
        await dbHandler.connect();

        // Create a user and get token for authentication
        const userData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'Password123'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(userData);

        authToken = response.body.data.token;
    });

    afterEach(async () => {
        await dbHandler.clearDatabase();

        // Recreate user and get fresh token after each test
        const userData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'Password123'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(userData);

        authToken = response.body.data.token;
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
    });

    describe('POST /api/category', () => {
        it('should create a category successfully', async () => {
            const categoryData = {
                name: 'Test Category',
                status: CategoryStatus.ACTIVE
            };

            const response = await request(app)
                .post('/api/category')
                .set('Authorization', `Bearer ${authToken}`)
                .send(categoryData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data.name).toBe(categoryData.name);
            expect(response.body.data.status).toBe(categoryData.status);
            expect(response.body.data.parent).toBe(null);

            // Check if category was actually created in the database
            const categoryId = response.body.data._id;
            const category = await Category.findById(categoryId);
            expect(category).toBeTruthy();
            if (category) { // Add null check for TypeScript
                expect(category.name).toBe(categoryData.name);
            }
        });

        it('should create a nested category successfully', async () => {
            // First create a parent category
            const parentCategoryData = {
                name: 'Parent Category',
                status: CategoryStatus.ACTIVE
            };

            const parentResponse = await request(app)
                .post('/api/category')
                .set('Authorization', `Bearer ${authToken}`)
                .send(parentCategoryData);

            const parentId = parentResponse.body.data._id;

            // Now create a child category
            const childCategoryData = {
                name: 'Child Category',
                parent: parentId,
                status: CategoryStatus.ACTIVE
            };

            const response = await request(app)
                .post('/api/category')
                .set('Authorization', `Bearer ${authToken}`)
                .send(childCategoryData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.parent.toString()).toBe(parentId);

            // Check if child category was correctly created with parent reference
            const childId = response.body.data._id;
            const childCategory = await Category.findById(childId);
            expect(childCategory).toBeTruthy();
            if (childCategory) { // Add null check for TypeScript
                expect(childCategory.parent?.toString()).toBe(parentId);
            }
        });

        it('should return error when parent category does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const categoryData = {
                name: 'Test Category',
                parent: nonExistentId
            };

            const response = await request(app)
                .post('/api/category')
                .set('Authorization', `Bearer ${authToken}`)
                .send(categoryData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Parent category not found');
        });

        it('should return error when not authenticated', async () => {
            const categoryData = {
                name: 'Test Category'
            };

            const response = await request(app)
                .post('/api/category')
                .send(categoryData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. No token provided');
        });
    });

    describe('GET /api/category', () => {
        beforeEach(async () => {
            // Create sample categories hierarchy
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

        it('should retrieve category tree successfully', async () => {
            const response = await request(app)
                .get('/api/category')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);

            // Should have one root category
            expect(response.body.data.length).toBe(1);

            // Root category should have two children
            const rootCategory = response.body.data[0];
            expect(rootCategory.children.length).toBe(2);

            // First child should have one child (grandchild)
            const childCategory1 = rootCategory.children.find((c: any) => c.name === 'Child Category 1');
            expect(childCategory1).toBeTruthy();
            if (childCategory1) { // Add null check for TypeScript
                expect(childCategory1.children.length).toBe(1);
            }
        });

        it('should return error when not authenticated', async () => {
            const response = await request(app)
                .get('/api/category')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. No token provided');
        });
    });

    describe('PUT /api/category/:id', () => {
        let categoryId: string;

        beforeEach(async () => {
            // Create a category for update tests
            const category = new Category({
                name: 'Original Category',
                status: CategoryStatus.ACTIVE
            });
            await category.save();
            categoryId = category._id.toString();
        });

        it('should update category name successfully', async () => {
            const updateData = {
                name: 'Updated Category Name'
            };

            const response = await request(app)
                .put(`/api/category/${categoryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(updateData.name);

            // Check if category was actually updated in the database
            const updatedCategory = await Category.findById(categoryId);
            expect(updatedCategory).toBeTruthy();
            if (updatedCategory) { // Add null check for TypeScript
                expect(updatedCategory.name).toBe(updateData.name);
            }
        });

        it('should update category status and affect child categories', async () => {
            // Create a child category
            const childCategory = new Category({
                name: 'Child Category',
                parent: categoryId,
                status: CategoryStatus.ACTIVE
            });
            await childCategory.save();
            const childId = childCategory._id;

            // Update parent category status to inactive
            const updateData = {
                status: CategoryStatus.INACTIVE
            };

            await request(app)
                .put(`/api/category/${categoryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            // Check if child category was automatically set to inactive
            const updatedChildCategory = await Category.findById(childId);
            expect(updatedChildCategory).toBeTruthy();
            if (updatedChildCategory) { // Add null check for TypeScript
                expect(updatedChildCategory.status).toBe(CategoryStatus.INACTIVE);
            }
        });

        it('should return error when category does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const updateData = {
                name: 'Updated Name'
            };

            const response = await request(app)
                .put(`/api/category/${nonExistentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Category not found');
        });
    });

    describe('DELETE /api/category/:id', () => {
        let rootCategoryId: string;
        let childCategoryId: string;
        let grandchildCategoryId: string;

        beforeEach(async () => {
            // Create a category hierarchy for deletion tests
            const rootCategory = new Category({
                name: 'Root Category',
                status: CategoryStatus.ACTIVE
            });
            await rootCategory.save();
            rootCategoryId = rootCategory._id.toString();

            const childCategory = new Category({
                name: 'Child Category',
                parent: rootCategoryId,
                status: CategoryStatus.ACTIVE
            });
            await childCategory.save();
            childCategoryId = childCategory._id.toString();

            const grandchildCategory = new Category({
                name: 'Grandchild Category',
                parent: childCategoryId,
                status: CategoryStatus.ACTIVE
            });
            await grandchildCategory.save();
            grandchildCategoryId = grandchildCategory._id.toString();
        });

        it('should delete a leaf category successfully', async () => {
            const response = await request(app)
                .delete(`/api/category/${grandchildCategoryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Check if category was actually deleted from the database
            const deletedCategory = await Category.findById(grandchildCategoryId);
            expect(deletedCategory).toBeNull();
        });

        it('should delete a middle category and reassign children to its parent', async () => {
            const response = await request(app)
                .delete(`/api/category/${childCategoryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Check if middle category was deleted
            const deletedCategory = await Category.findById(childCategoryId);
            expect(deletedCategory).toBeNull();

            // Check if grandchild was reassigned to root
            const reassignedGrandchild = await Category.findById(grandchildCategoryId);
            expect(reassignedGrandchild).toBeTruthy();
            if (reassignedGrandchild) { // Add null check for TypeScript
                expect(reassignedGrandchild.parent?.toString()).toBe(rootCategoryId);
            }
        });

        it('should delete a root category and make children root categories', async () => {
            const response = await request(app)
                .delete(`/api/category/${rootCategoryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Check if root was deleted
            const deletedCategory = await Category.findById(rootCategoryId);
            expect(deletedCategory).toBeNull();

            // Check if child was made a root category
            const updatedChild = await Category.findById(childCategoryId);
            expect(updatedChild).toBeTruthy();
            if (updatedChild) { // Add null check for TypeScript
                expect(updatedChild.parent).toBeNull();
            }
        });

        it('should return error when category does not exist', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const response = await request(app)
                .delete(`/api/category/${nonExistentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Category not found');
        });
    });
});