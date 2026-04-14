import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { Event, Follow, Organization, User } from '@prisma/client';

interface ResponseUser {
    accessToken: string;
    user: User;
}

describe('Follow (e2e)', () => {
    let app: INestApplication;

    // the 1st user
    let followerUser: ResponseUser;

    // the 2nd user
    let targetUser: ResponseUser;

    // created on create
    // immediately deleted (test: unfollow)
    let testFollow: Follow;

    const listNewAccounts: ResponseUser[] = [];

    let testOrg: Organization;
    let testEvent: Event;

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

    // POST: follows
    describe('create follow record', () => {
        beforeAll(async () => {
            // create follower
            const follower = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'follower-e2e-test@test.com',
                    password: 'password123',
                    displayName: 'Follower E2E User',
                });

            followerUser = {
                accessToken: follower.body.data.accessToken,
                user: follower.body.data.user,
            };

            // create target
            const target = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'follower-target-e2e-test@test.com',
                    password: 'password123',
                    displayName: 'Follower target E2E User',
                });

            targetUser = {
                accessToken: target.body.data.accessToken,
                user: target.body.data.user,
            };
        });

        it('should return 201 for following a user', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/follows')
                .set('Authorization', `Bearer ${followerUser.accessToken}`)
                .send({
                    targetId: targetUser.user.id,
                    targetType: 'USER',
                });

            expect(res.statusCode).toBe(201);
            testFollow = res.body.data;
        });

        it('should return 400 for following yourself', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/follows')
                .set('Authorization', `Bearer ${followerUser.accessToken}`)
                .send({
                    targetId: followerUser.user.id,
                    targetType: 'USER',
                });

            expect(res.statusCode).toBe(400);
        });

        it('should return 400 for invalid target type', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/follows')
                .set('Authorization', `Bearer ${followerUser.accessToken}`)
                .send({
                    targetId: followerUser.user.id,
                    targetType: 'USERasdasd',
                });

            expect(res.statusCode).toBe(400);
        });

        it('should return 409 for following an already followed user', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/follows')
                .set('Authorization', `Bearer ${followerUser.accessToken}`)
                .send({
                    targetId: targetUser.user.id,
                    targetType: 'USER',
                });

            expect(res.statusCode).toBe(409);
        });
    });

    // DELETE: follows/:id
    describe('unfollow', () => {
        it('should return 403 if tried to unfollow not your own record', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/api/v1/follows/${testFollow.id}`)
                .set('Authorization', `Bearer ${targetUser.accessToken}`);

            expect(res.statusCode).toBe(403);
        });

        it('should delete follow record', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/api/v1/follows/${testFollow.id}`)
                .set('Authorization', `Bearer ${followerUser.accessToken}`);

            expect(res.statusCode).toBe(200);
        });
    });

    // Get: users/:id/following
    // Get your followers
    describe('listFollowing', () => {
        beforeAll(async () => {
            // Get 5 followers on your account
            for (let i = 0; i < 5; i++) {
                const newAccount = await request(app.getHttpServer())
                    .post('/api/v1/auth/register')
                    .send({
                        email: `follower${i}-e2e-test@test.com`,
                        password: 'password123',
                        displayName: `Follower ${i} E2E User`,
                    });

                // cache the test accounts
                // will be used by other tests below
                listNewAccounts.push(newAccount.body.data);

                // follow user
                await request(app.getHttpServer())
                    .post('/api/v1/follows')
                    .set('Authorization', `Bearer ${followerUser.accessToken}`)
                    .send({
                        targetId: newAccount.body.data.user.id,
                        targetType: 'USER',
                    });
            }
        }, 30000);

        it('should be able to return your followers', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/users/me/following')
                .set('Authorization', `Bearer ${followerUser.accessToken}`);

            expect(res.body.data.length).toBe(5);
        });
    });

    // Get: users/:id/followers
    // Get target's followers
    describe('list user followers', () => {
        beforeAll(async () => {
            // Get the cached results from the above test
            for (const newAccount of listNewAccounts) {
                // new account follows target user (our second user)
                await request(app.getHttpServer())
                    .post('/api/v1/follows')
                    .set('Authorization', `Bearer ${newAccount.accessToken}`)
                    .send({
                        targetId: targetUser.user.id,
                        targetType: 'USER',
                    });
            }
        }, 30000);

        it('should be able to return the user followers of target', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/users/${targetUser.user.id}/followers`)
                .set('Authorization', `Bearer ${targetUser.accessToken}`);

            expect(res.body.data.length).toBe(5);
        });
    });

    // Get: organizations/:id/followers
    // Get org's followers
    describe('list org followers', () => {
        beforeAll(async () => {
            // create test org using followerUser (test user) as OWNER
            const res = await request(app.getHttpServer())
                .post('/api/v1/organizations')
                .set('Authorization', `Bearer ${followerUser.accessToken}`)
                .send({
                    name: 'Test Followe Org',
                    description: 'E2E testing org.',
                });

            testOrg = res.body.data;

            // Get the cached results from the above test
            for (const newAccount of listNewAccounts) {
                // new account follows target user (our second user)
                await request(app.getHttpServer())
                    .post('/api/v1/follows')
                    .set('Authorization', `Bearer ${newAccount.accessToken}`)
                    .send({
                        targetId: testOrg.id,
                        targetType: 'ORGANIZATION',
                    });
            }
        }, 30000);

        it('should be able to return the org followers of target', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/orgs/${testOrg.id}/followers`)
                .set('Authorization', `Bearer ${targetUser.accessToken}`);

            expect(res.body.data.length).toBe(5);
        });
    });

    // Get: events/:id/followers
    // Get event's followers
    describe('list event followers', () => {
        beforeAll(async () => {
            // Create event
            const res = await request(app.getHttpServer())
                .post(`/api/v1/events/${testOrg.id}`)
                .set('Authorization', `Bearer ${followerUser.accessToken}`)
                .send({
                    name: 'Test Event',
                    startDate: '2026-06-01',
                    endDate: '2026-06-02',
                });

            testEvent = res.body.data;

            // Get the cached results from the above test
            for (const newAccount of listNewAccounts) {
                // new account follows target user (our second user)
                await request(app.getHttpServer())
                    .post('/api/v1/follows')
                    .set('Authorization', `Bearer ${newAccount.accessToken}`)
                    .send({
                        targetId: testEvent.id,
                        targetType: 'EVENT',
                    });
            }
        }, 30000);

        it('should be able to return the event followers of target', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/events/${testEvent.id}/followers`)
                .set('Authorization', `Bearer ${targetUser.accessToken}`);

            expect(res.body.data.length).toBe(5);
        });
    });

    describe('is following users', () => {
        it('should return true if following user', async () => {
            // choose a new account randomly
            const randomUser =
                listNewAccounts[
                    Math.floor(Math.random() * listNewAccounts.length)
                ];

            // test against target user
            const res = await request(app.getHttpServer())
                .get(
                    `/api/v1/isFollowing/${randomUser.user.id}/${targetUser.user.id}/user`,
                )
                .set('Authorization', `Bearer ${randomUser.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toBe(true);
        });

        it('should return false if not following user', async () => {
            // choose a new account randomly
            const randomUser =
                listNewAccounts[
                    Math.floor(Math.random() * listNewAccounts.length)
                ];

            // test against target user
            const res = await request(app.getHttpServer())
                .get(
                    `/api/v1/isFollowing/${randomUser.user.id}/${followerUser.user.id}/user`,
                )
                .set('Authorization', `Bearer ${randomUser.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toBe(false);
        });

        it('should return true if following org', async () => {
            // choose a new account randomly
            const randomUser =
                listNewAccounts[
                    Math.floor(Math.random() * listNewAccounts.length)
                ];

            // test against test org
            const res = await request(app.getHttpServer())
                .get(
                    `/api/v1/isFollowing/${randomUser.user.id}/${testOrg.id}/org`,
                )
                .set('Authorization', `Bearer ${randomUser.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toBe(true);
        });

        it('should return true if following org', async () => {
            // choose a new account randomly
            const randomUser =
                listNewAccounts[
                    Math.floor(Math.random() * listNewAccounts.length)
                ];

            // test against test event
            const res = await request(app.getHttpServer())
                .get(
                    `/api/v1/isFollowing/${randomUser.user.id}/${testEvent.id}/event`,
                )
                .set('Authorization', `Bearer ${randomUser.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toBe(true);
        });
    });
});
