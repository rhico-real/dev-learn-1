import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { User } from '@prisma/client';

describe('Feed (e2e)', () => {
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

    describe('List Feed', () => {
        let listUsers: User[] = [];

        beforeAll(async () => {
            // create 10 users
            for (let i = 0; i < 10; i++) {
                const user = await request(app.getHttpServer())
                    .post('/api/v1/auth/register')
                    .send({
                        email: `feed-${i}-e2e-test@test.com`,
                        password: 'password123',
                        displayName: `Feed ${i} E2E User`,
                    });

                listUsers.push(user.body.data.user);

                // create post for each user
                const post = await request(app.getHttpServer())
                    .post('/api/v1/posts')
                    .set(
                        'Authorization',
                        `Bearer ${user.body.data.accessToken}`,
                    )
                    .send({
                        content: 'Test Content',
                    });
            }

            // create follower user
            const res = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'feed-owner-e2e-test@test.com',
                    password: 'password123',
                    displayName: 'Feed E2E User',
                });

            owner = {
                accessToken: res.body.data.accessToken,
                user: res.body.data.user,
            };

            // follower user follows the 10 users
            for (const user of listUsers) {
                await request(app.getHttpServer())
                    .post('/api/v1/follows')
                    .set('Authorization', `Bearer ${owner.accessToken}`)
                    .send({
                        targetId: user.id,
                        targetType: 'USER',
                    });
            }
        });

        // feed should return 10 posts from all the followers
        it('should return 200 when getting feed', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/feed')
                .set('Authorization', `Bearer ${owner.accessToken}`);

            expect(res.statusCode).toBe(200);
        });
    });
});
