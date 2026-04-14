import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { Event, Race } from '@prisma/client';

describe('Race (e2e)', () => {
    let app: INestApplication;

    let accessToken: string;
    let orgId: string;
    let draftEvent: Event;

    let raceTest: Race;
    let raceTest2: Race;

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

    /**
     * TESTS:
     * - Create race on draft event (201)
     * - List Races for event
     * - Update race on draft event
     * - Publish the event
     * - Try creating race on published event (should 400)
     * - Try updating race on published event (should 400)
     * - Try deleting race on published event (should 400)
     */
    describe('Create race', () => {
        beforeAll(async () => {
            // create owner of org
            const owner = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'race-e2e-test@test.com',
                    password: 'password123',
                    displayName: 'Race E2E User',
                });

            accessToken = owner.body.data.accessToken;

            // create org
            const org = await request(app.getHttpServer())
                .post('/api/v1/organizations')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Race Test Org',
                    description: 'Race E2E testing org.',
                });
            // console.log(org);
            orgId = org.body.data.id;

            // create draft event
            const event = await request(app.getHttpServer())
                .post(`/api/v1/events/${orgId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Race Test Event',
                    startDate: '2026-06-01',
                    endDate: '2026-06-02',
                });

            draftEvent = event.body.data;
        });

        it('should return 201 on creating race on draft event', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/v1/events/${draftEvent.id}/races`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Race Test',
                    distance: 123.45,
                    unit: 'test-unit',
                    maxParticipants: 500,
                    price: 1000,
                });

            raceTest = res.body.data;
            expect(res.statusCode).toBe(201);
            expect(res.body.data.name).toBe('Race Test');
        });
    });

    describe('List races', () => {
        beforeAll(async () => {
            // create +29 races
            for (let i = 0; i < 29; i++) {
                const res = await request(app.getHttpServer())
                    .post(`/api/v1/events/${draftEvent.id}/races`)
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({
                        name: `Race Test ${i}`,
                        distance: 123.45,
                        unit: 'test-unit',
                        maxParticipants: 500,
                        price: 1000,
                    });

                // Will be used for later test suites
                if (i === 1) {
                    raceTest2 = res.body.data;
                }
            }
        });

        // 29 (above) + 1 (create test suite) = 30 races all in all
        it('should be able to list races', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/events/${draftEvent.id}/races`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(30);
        });
    });

    describe('Update race', () => {
        it('should be able to update race on draft event', async () => {
            const res = await request(app.getHttpServer())
                .patch(`/api/v1/races/${raceTest.id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Updated Race Test',
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.name).toBe('Updated Race Test');
        });
    });

    describe('Delete race', () => {
        it('should be able to update race on draft event', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/api/v1/races/${raceTest.id}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.name).toBe('Updated Race Test');
        });
    });

    describe('Race Operation if Published Event', () => {
        beforeAll(async () => {
            // publish the event
            await request(app.getHttpServer())
                .patch(`/api/v1/events/${draftEvent.id}/status`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    status: 'PUBLISHED',
                });
        });

        it('should be 400 if creating a race on a published event', async () => {
            // draftEvent here is now published because of beforeAll

            const res = await request(app.getHttpServer())
                .post(`/api/v1/events/${draftEvent.id}/races`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Race Test 2',
                    distance: 123.45,
                    unit: 'test-unit-2',
                    maxParticipants: 500,
                    price: 1000,
                });

            expect(res.statusCode).toBe(400);
        });

        it('should be 400 if updating a race on a published event', async () => {
            // draftEvent here is now published because of beforeAll

            const res = await request(app.getHttpServer())
                .patch(`/api/v1/races/${raceTest2.id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Updated Race Test',
                });

            expect(res.statusCode).toBe(400);
        });

        it('should be 400 if deleting a race on a published event', async () => {
            // draftEvent here is now published because of beforeAll

            const res = await request(app.getHttpServer())
                .delete(`/api/v1/races/${raceTest2.id}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.statusCode).toBe(400);
        });
    });
});
