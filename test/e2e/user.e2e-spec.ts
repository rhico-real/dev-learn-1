import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { Platform, User } from '@prisma/client';
import request from 'supertest';

describe('User (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api/v1');
        app.useGlobalPipes(
            new ValidationPipe({ whitelist: true, transform: true }),
        );
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    let user: { accessToken: string; user: User };
    let user2: { accessToken: string; user: User };

    /**
     * Flow:
     * 1. Register User
     * 2. Save userdata here
     */
    beforeAll(async () => {
        const register = await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({
                email: 'user-controller-e2e-test@test.com',
                password: 'password123',
                displayName: 'User Controller E2E User',
            });

        user = {
            accessToken: register.body.data.accessToken,
            user: register.body.data.user,
        };
    });

    describe('get the current user', () => {
        it('should be able to get current user', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/users/me')
                .set('Authorization', `Bearer ${user.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.id).toBe(user.user.id);
        });
    });

    describe('update the current user', () => {
        it('should be able to update current user', async () => {
            const res = await request(app.getHttpServer())
                .patch('/api/v1/users/me')
                .set('Authorization', `Bearer ${user.accessToken}`)
                .send({
                    displayName: 'Updated User Controller E2E User',
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.displayName).toBe(
                'Updated User Controller E2E User',
            );
        });
    });

    describe('get other user by id', () => {
        beforeAll(async () => {
            const register = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'user-controller-2-e2e-test@test.com',
                    password: 'password123',
                    displayName: 'User Controller E2E User',
                });

            user2 = {
                accessToken: register.body.data.accessToken,
                user: register.body.data.user,
            };
        });

        it('should be able to get another user by their id', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/users/${user2.user.id}`)
                .set('Authorization', `Bearer ${user.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.id).toBe(user2.user.id);
        });
    });

    describe('register device token', () => {
        it('should be able to register device token', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/v1/users/me/device-token`)
                .set('Authorization', `Bearer ${user.accessToken}`)
                .send({
                    token: user.accessToken,
                    platform: Platform.IOS,
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.data.token).toBe(user.accessToken);
        });
    });

    describe('remove device token', () => {
        it('should be able to remove device token', async () => {
            const res = await request(app.getHttpServer())
                .delete(
                    `/api/v1/users/me/device-token?token=${user.accessToken}`,
                )
                .set('Authorization', `Bearer ${user.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.count).toBe(1);
        });
    });
});
