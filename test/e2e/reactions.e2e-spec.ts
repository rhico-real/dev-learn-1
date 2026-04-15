import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { Post, PostLike, User } from '@prisma/client';

describe('Reaction (e2e)', () => {
    let app: INestApplication;

    let owner: { accessToken: string; user: User };
    let testPost: Post;
    let reactionRecord: PostLike;

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

    describe('Like a post', () => {
        beforeAll(async () => {
            // create a user
            const res = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'post-e2e-test@test.com',
                    password: 'password123',
                    displayName: 'Post E2E User',
                });

            owner = {
                accessToken: res.body.data.accessToken,
                user: res.body.data.user,
            };

            // create a post
            const post = await request(app.getHttpServer())
                .post('/api/v1/posts')
                .set('Authorization', `Bearer ${owner.accessToken}`)
                .send({
                    content: 'Test Content',
                });

            testPost = post.body.data;
        });

        it('should return 201 if liking a post', async () => {
            const like = await request(app.getHttpServer())
                .post(`/api/v1/posts/${testPost.id}/likes`)
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(like.statusCode).toBe(201);
            reactionRecord = like.body.data;
        });

        it('should return 409 if liked the same post again', async () => {
            const like = await request(app.getHttpServer())
                .post(`/api/v1/posts/${testPost.id}/likes`)
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(like.statusCode).toBe(409);
        });
    });

    describe('Unlike a post', () => {
        it('should return 200 if unliked a post', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/api/v1/posts/${reactionRecord.id}/likes`)
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(res.statusCode).toBe(200);
        });

        it('should return 404 if unliked again a gone post', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/api/v1/posts/${reactionRecord.id}/likes`)
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(res.statusCode).toBe(404);
        });
    });
});
