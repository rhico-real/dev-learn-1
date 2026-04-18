import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { Post, PostComment, PostLike, User } from '@prisma/client';

describe('Reaction (e2e)', () => {
    let app: INestApplication;

    let owner: { accessToken: string; user: User };
    let commentUser: { accessToken: string; user: User };

    let testPost: Post;
    let reactionRecord: PostLike;
    let commentRecord: PostComment;

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
                    email: 'reactions-e2e-test@test.com',
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

    // Create comment
    describe('Create comment', () => {
        it('should return 201 when creating comment', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/v1/posts/${testPost.id}/comments`)
                .set('Authorization', `Bearer ${owner.accessToken}`)
                .send({
                    content: 'Test comment',
                });

            expect(res.statusCode).toBe(201);
            commentRecord = res.body.data;
        });

        it('should return 404 when creating comment but post not found', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/posts/asd123/comments')
                .set('Authorization', `Bearer ${owner.accessToken}`)
                .send({
                    content: 'Test comment',
                });

            expect(res.statusCode).toBe(404);
        });
    });

    // Get comments
    describe('Get comments', () => {
        let nextCursor: string;
        let listCommentsPageOne = new Set();

        // create 29 comments on that post
        // 1 create + 29 here = 30 comments all in all
        beforeAll(async () => {
            for (let i = 0; i < 29; i++) {
                const res = await request(app.getHttpServer())
                    .post(`/api/v1/posts/${testPost.id}/comments`)
                    .set('Authorization', `Bearer ${owner.accessToken}`)
                    .send({
                        content: `Test comment ${i}`,
                    });
            }
        });

        it('should return 200 when getting 20 comments without cursor without limit', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/posts/${testPost.id}/comments`)
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(20);
        });

        // without cursor with limit
        it('should return 200 when getting 10 comments without cursor without limit', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/posts/${testPost.id}/comments?limit=10`)
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(10);

            // to be used on next test
            nextCursor = res.body.meta.cursor;
            listCommentsPageOne = new Set(
                (res.body.data as PostComment[]).map((element) => element.id),
            );
        });

        // with cursor with limit
        it('should return 200 when getting 10 comments with cursor with limit (no duplication)', async () => {
            const res = await request(app.getHttpServer())
                .get(
                    `/api/v1/posts/${testPost.id}/comments?cursor=${nextCursor}&limit=10`,
                )
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(res.statusCode).toBe(200);

            const newList = res.body.data as PostComment[];

            expect(newList.length).toBe(10);

            /**
             * Result: [{id, ...},{id ...},{id ...}]
             * 1. Transform the old list to a Set
             * 2. Use Array.some to check if some of the element check is true
             * 3. Element check -> Check Set if on new list, there is one who matches.
             *
             * If there's just one match, it means there is a duplicate and the test fails.
             */

            const isDuplicate = newList.some((element) =>
                listCommentsPageOne.has(element.id),
            );

            expect(isDuplicate).toBe(false);
        });
    });

    // Patch comment
    describe('Update comment', () => {
        beforeAll(async () => {
            // create another user
            const res = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'comment-2-e2e-test@test.com',
                    password: 'password123',
                    displayName: 'Comment 2 E2E User',
                });

            commentUser = {
                accessToken: res.body.data.accessToken,
                user: res.body.data.user,
            };
        });

        it('should return 200 when updating comment', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/api/v1/posts/comments/${commentRecord.id}`)
                .set('Authorization', `Bearer ${owner.accessToken}`)
                .send({
                    content: 'Updated comment',
                });

            expect(res.statusCode).toBe(200);
        });

        it('should return 403 if updating but not your comment', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/api/v1/posts/comments/${commentRecord.id}`)
                .set('Authorization', `Bearer ${commentUser.accessToken}`)
                .send({
                    content: 'Updated comment',
                });

            expect(res.statusCode).toBe(403);
        });
    });

    // Delete comment
    describe('Delete comment', () => {
        it('should return 200 when deleting comment', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/api/v1/posts/comments/${commentRecord.id}`)
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(res.statusCode).toBe(200);
        });

        it('should return 403 if deleting but not your comment', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/api/v1/posts/comments/${commentRecord.id}`)
                .set('Authorization', `Bearer ${commentUser.accessToken}`);

            expect(res.statusCode).toBe(403);
        });
    });
});
