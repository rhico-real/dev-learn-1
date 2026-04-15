import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../../src/domain/social/post/post.service';
import { AppModule } from '../../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Post, User } from '@prisma/client';
import request from 'supertest';

describe('Post (e2e)', () => {
    let app: INestApplication;

    let owner: { accesstoken: string; user: User };
    let testPost: Post;

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

    // test if can post
    // test if can get specific post
    // test if can get list of posts of user
    // test if can get list of my posts
    // test if can update post
    // test if can delete post

    describe('create post', () => {
        beforeAll(async () => {
            // create user
            const res = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'post-e2e-test@test.com',
                    password: 'password123',
                    displayName: 'Post E2E User',
                });

            owner = {
                accesstoken: res.body.data.accessToken,
                user: res.body.data,
            };
        });

        it('should return 201 on creating post', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/posts')
                .set('Authorization', `Bearer ${owner.accesstoken}`)
                .send({
                    content: 'Test Content',
                });

            expect(res.statusCode).toBe(201);
            testPost = res.body.data;
        });
    });

    describe('get specific post', () => {
        it('should return 200 on getting specific post', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/posts/${testPost.id}`)
                .set('Authorization', `Bearer ${owner.accesstoken}`);

            expect(res.statusCode).toBe(200);
        });
    });

    describe('get list of post of user', () => {
        let user: { accessToken: string; id: string };

        beforeAll(async () => {
            // create second user
            // create 10 posts for that user
            const res = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'post-2-e2e-test@test.com',
                    password: 'password123',
                    displayName: 'Post second E2E User',
                });

            user = {
                accessToken: res.body.data.accessToken,
                id: res.body.data.user.id,
            };

            for (let i = 0; i < 10; i++) {
                const post = await request(app.getHttpServer())
                    .post('/api/v1/posts')
                    .set('Authorization', `Bearer ${user.accessToken}`)
                    .send({
                        content: `Test Content ${i}`,
                    });
            }
        });

        it('should return 200 and 10 posts of specific user', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/users/${user.id}/posts`)
                .set('Authorization', `Bearer ${user.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(10);
        });
    });

    describe('get list of my post', () => {
        beforeAll(async () => {
            // create 10 posts
            for (let i = 0; i < 10; i++) {
                const post = await request(app.getHttpServer())
                    .post('/api/v1/posts')
                    .set('Authorization', `Bearer ${owner.accesstoken}`)
                    .send({
                        content: `Test Content ${i}`,
                    });
            }
        });

        it('should return 200 and 11 posts of my user', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/users/me/posts`)
                .set('Authorization', `Bearer ${owner.accesstoken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(11);
        });
    });

    describe('update post', () => {
        it('should return 200 after updating post', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/api/v1/posts/${testPost.id}`)
                .set('Authorization', `Bearer ${owner.accesstoken}`)
                .send({
                    content: 'Test updated post',
                });

            expect(res.statusCode).toBe(200);
        });
    });

    describe('delete post', () => {
        it('should return 200 after deleting post', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/api/v1/posts/${testPost.id}`)
                .set('Authorization', `Bearer ${owner.accesstoken}`);

            expect(res.statusCode).toBe(200);
        });
    });
});
