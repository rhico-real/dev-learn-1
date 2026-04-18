import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { Notification, User } from '@prisma/client';

describe('Notifications (e2e)', () => {
    let app: INestApplication;

    let owner: { accessToken: string; user: User };

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

    // Get: Notifications for users
    describe('Get Notifications for user', () => {
        let actors: { accessToken: string; user: User }[] = [];
        let listNotificationsPageOne: Notification[] = [];
        let nextCursor: string;

        beforeAll(async () => {
            // create post owner
            const user = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: `notification-e2e-test@test.com`,
                    password: 'password123',
                    displayName: `Notification E2E User`,
                });

            owner = {
                accessToken: user.body.data.accessToken,
                user: user.body.data.user,
            };

            // create 10 actors
            for (let i = 0; i < 10; i++) {
                const actor = await request(app.getHttpServer())
                    .post('/api/v1/auth/register')
                    .send({
                        email: `notification-user${i}-e2e-test@test.com`,
                        password: 'password123',
                        displayName: `Notification ${i} E2E User`,
                    });

                actors.push({
                    accessToken: actor.body.data.accessToken,
                    user: actor.body.data.user,
                });
            }

            // create a post
            const post = await request(app.getHttpServer())
                .post('/api/v1/posts')
                .set('Authorization', `Bearer ${owner.accessToken}`)
                .send({
                    content: 'Test Content',
                });

            // have all 10 actors like and comment on post 3 times
            for (const user of actors) {
                // like
                await request(app.getHttpServer())
                    .post(`/api/v1/posts/${post.body.data.id}/likes`)
                    .set('Authorization', `Bearer ${user.accessToken}`);

                for (let j = 0; j < 3; j++) {
                    // comment
                    await request(app.getHttpServer())
                        .post(`/api/v1/posts/${post.body.data.id}/comments`)
                        .set('Authorization', `Bearer ${user.accessToken}`)
                        .send({
                            content: `Test comment by ${user.user.displayName} #${j}`,
                        });
                }
            }
        });

        // test: return 20 notifications without cursor without limit
        it('should return 200 for getting list without cursor without limit', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/notifications')
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(20);
        });

        // test: return 5 notifications without cursor with limit
        it('should return 200 for getting list without cursor with limit', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/notifications?limit=5')
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(5);

            listNotificationsPageOne = res.body.data;
            nextCursor = res.body.meta.cursor;
        });

        // test: return 5 non-repeating notifications with cursor with limit
        it('should return 200 for getting list with cursor with limit', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/notifications?cursor=${nextCursor}&limit=5`)
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(5);

            const newList = res.body.data as Notification[];

            const bIds = new Set(
                listNotificationsPageOne.map((element) => element.id),
            );

            const isDuplicate = newList.some((element) => bIds.has(element.id));

            expect(isDuplicate).toBe(false);
        });
    });

    // Get: Unread count
    describe('Get unread count notifications', () => {
        /**
         * Why 40?
         * We have 10 actors from above test. 1 like and 3 comments each
         * 10 likes + 30 comments = 40 notifications
         */
        it('should return 200 for 40 unread notifications', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/notifications/unread-count')
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toBe(40);
        });
    });

    // Patch: mark as read
    describe('Mark notification as read', () => {
        let readNotification: Notification;

        beforeAll(async () => {
            // get 1 sample notification
            const notif = await request(app.getHttpServer())
                .get('/api/v1/notifications?limit=1')
                .set('Authorization', `Bearer ${owner.accessToken}`);

            readNotification = (notif.body.data as Notification[])[0];
        });

        it('should return 200 when marking unread notification as read', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/api/v1/notifications/${readNotification.id}/read`)
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(res.statusCode).toBe(200);

            const notification = res.body.data as Notification;

            expect(notification.readAt).not.toBe(null);
        });
    });

    // Patch: mark all as read
    describe('Mark all notification as read', () => {
        it('should return 200 when marking all unread notification as read', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/api/v1/notifications/read-all`)
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(res.statusCode).toBe(200);

            // get all unread notification and should return to 0
            const unreads = await request(app.getHttpServer())
                .get('/api/v1/notifications/unread-count')
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(unreads.statusCode).toBe(200);
            expect(unreads.body.data).toBe(0);
        });
    });
});
