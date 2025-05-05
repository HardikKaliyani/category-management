import request from 'supertest';
import app from '../../src/app';
import * as dbHandler from './mongo-memory.server';
import { User } from '../../src/models/user.model';

describe('Auth Routes', () => {
    beforeAll(async () => {
        await dbHandler.connect();
    });

    afterEach(async () => {
        await dbHandler.clearDatabase();
    });

    afterAll(async () => {
        await dbHandler.closeDatabase();
    });

    const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123'
    };

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user).toHaveProperty('id');
            expect(response.body.data.user.name).toBe(userData.name);
            expect(response.body.data.user.email).toBe(userData.email);

            // Check if user was actually created in the database
            const user = await User.findOne({ email: userData.email });
            expect(user).toBeTruthy();
            expect(user?.name).toBe(userData.name);
        });

        it('should return validation error for missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    // Missing email and password
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation error');
            expect(response.body.errors).toBeTruthy();
        });

        it('should return error for duplicate email', async () => {
            // First create a user
            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            // Try to create another user with the same email
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User with this email already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a user for login tests
            await request(app)
                .post('/api/auth/register')
                .send(userData);
        });

        it('should login user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user).toHaveProperty('id');
            expect(response.body.data.user.email).toBe(userData.email);
        });

        it('should return error for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: 'WrongPassword123'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid email or password');
        });
    });

    describe('GET /api/auth/me', () => {
        let authToken: string;

        beforeEach(async () => {
            // Create a user and get token
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);

            authToken = response.body.data.token;
        });

        it('should get current user profile successfully', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data.name).toBe(userData.name);
            expect(response.body.data.email).toBe(userData.email);
            expect(response.body.data).not.toHaveProperty('password');
        });

        it('should return error for missing token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. No token provided');
        });

        it('should return error for invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalidtoken')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid or expired token');
        });
    });
});