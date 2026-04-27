import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { Registration, RegistrationStatus } from '@prisma/client';

describe('Registration (e2e)', () => {
    let app: INestApplication;

    let ownerAccessToken: string;
    let orgId: string;

    // published
    let eventId: string;
    let raceId: string;

    // draft(unpublished)
    let unpublishedeventId: string;
    let unpublishedraceId: string;

    let registrationId: string;

    // user 2 registration
    let user2RegistrationId: string;

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

    // register for a race (201)
    // try registering again (should 409)
    // create a second user, register them too
    // try registering on an unpublished event (should 400)
    // cancel registration
    // list user's registration
    // admin confirms a registration

    describe('Register a race', () => {
        let freeRaceId: string;

        beforeAll(async () => {
            // create a user
            const owner = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'reg-e2e-test@test.com',
                    password: 'password123',
                    displayName: 'Registration E2E User',
                });

            ownerAccessToken = owner.body.data.accessToken;

            // create an org
            const org = await request(app.getHttpServer())
                .post('/api/v1/organizations')
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    name: 'Registration Test Org',
                    description: 'Registration E2E testing org.',
                });

            orgId = org.body.data.id;

            // create a draft event
            const event = await request(app.getHttpServer())
                .post(`/api/v1/events/${orgId}`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    name: 'Registration Test Event',
                    startDate: '2026-06-01',
                    endDate: '2026-06-02',
                });

            eventId = event.body.data.id;

            // create a race
            const race = await request(app.getHttpServer())
                .post(`/api/v1/events/${eventId}/races`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    name: 'Registration Race Test',
                    distance: 123.45,
                    unit: 'test-unit',
                    maxParticipants: 500,
                    price: 1000,
                });

            raceId = race.body.data.id;

            // create a free race
            const freeRace = await request(app.getHttpServer())
                .post(`/api/v1/events/${eventId}/races`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    name: 'Registration Free Race Test',
                    distance: 123.45,
                    unit: 'test-unit',
                    maxParticipants: 500,
                    price: 0,
                });

            freeRaceId = freeRace.body.data.id;

            // publish the event
            const publish = await request(app.getHttpServer())
                .patch(`/api/v1/events/${eventId}/status`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    status: 'PUBLISHED',
                });

            // UNPUBLISHED
            // create a draft event
            const draftEvent = await request(app.getHttpServer())
                .post(`/api/v1/events/${orgId}`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    name: 'Registration Test Event',
                    startDate: '2026-06-01',
                    endDate: '2026-06-02',
                });

            unpublishedeventId = draftEvent.body.data.id;

            // create a race
            const draftRace = await request(app.getHttpServer())
                .post(`/api/v1/events/${unpublishedeventId}/races`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    name: 'Registration Race Test',
                    distance: 123.45,
                    unit: 'test-unit',
                    maxParticipants: 500,
                    price: 1000,
                });

            unpublishedraceId = draftRace.body.data.id;
        });

        it('should be able to register a race', async () => {
            const result = await request(app.getHttpServer())
                .post(`/api/v1/races/${raceId}/registrations`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({});

            registrationId = result.body.data.id;

            expect(result.statusCode).toBe(201);
        });

        it('should be able to have a confirmed registration of a free race', async () => {
            const result = await request(app.getHttpServer())
                .post(`/api/v1/races/${freeRaceId}/registrations`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({});

            registrationId = result.body.data.id;

            expect(result.statusCode).toBe(201);
            expect(result.body.data.status).toBe(RegistrationStatus.CONFIRMED);
        });

        it('should return 409 if I register again', async () => {
            const result = await request(app.getHttpServer())
                .post(`/api/v1/races/${raceId}/registrations`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({});

            expect(result.statusCode).toBe(409);
        });

        it('should return 201 if I register another user', async () => {
            const user = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'reg-user2-e2e-test@test.com',
                    password: 'password123',
                    displayName: 'Registration User 2 E2E User',
                });

            const result = await request(app.getHttpServer())
                .post(`/api/v1/races/${raceId}/registrations`)
                .set('Authorization', `Bearer ${user.body.data.accessToken}`)
                .send({});

            user2RegistrationId = result.body.data.id;

            expect(result.statusCode).toBe(201);
        });

        it('should return 400 if I register on unpublished event', async () => {
            const user = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'reg-user3-e2e-test@test.com',
                    password: 'password123',
                    displayName: 'Registration User 3 E2E User',
                });

            const result = await request(app.getHttpServer())
                .post(`/api/v1/races/${unpublishedraceId}/registrations`)
                .set('Authorization', `Bearer ${user.body.data.accessToken}`)
                .send({});

            expect(result.statusCode).toBe(400);
        });
    });

    describe('Cancel Registration', () => {
        it('should be able to cancel registration', async () => {
            const result = await request(app.getHttpServer())
                .delete(`/api/v1/registrations/${registrationId}`)
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            expect(result.statusCode).toBe(200);
        });
    });

    describe('List By User Registration', () => {
        let listRegistrationsPageOne: Registration[];
        let nextCursor: string;

        beforeAll(async () => {
            // create 30 events and race
            // create 30 registrations for the same user

            for (let i = 0; i < 30; i++) {
                // create event
                const event = await request(app.getHttpServer())
                    .post(`/api/v1/events/${orgId}`)
                    .set('Authorization', `Bearer ${ownerAccessToken}`)
                    .send({
                        name: `Registration Test Event ${i}`,
                        startDate: '2026-06-01',
                        endDate: '2026-06-02',
                    });

                // create a race
                const race = await request(app.getHttpServer())
                    .post(`/api/v1/events/${event.body.data.id}/races`)
                    .set('Authorization', `Bearer ${ownerAccessToken}`)
                    .send({
                        name: `Registration Race Test ${i}`,
                        distance: 123.45,
                        unit: 'test-unit',
                        maxParticipants: 500,
                        price: 1000,
                    });

                // publish event
                const publish = await request(app.getHttpServer())
                    .patch(`/api/v1/events/${event.body.data.id}/status`)
                    .set('Authorization', `Bearer ${ownerAccessToken}`)
                    .send({
                        status: 'PUBLISHED',
                    });

                // register
                const register = await request(app.getHttpServer())
                    .post(`/api/v1/races/${race.body.data.id}/registrations`)
                    .set('Authorization', `Bearer ${ownerAccessToken}`)
                    .send({});

                if (i % 3 === 0) {
                    // confirm registration
                    await request(app.getHttpServer())
                        .patch(
                            `/api/v1/registrations/${register.body.data.id}/confirm`,
                        )
                        .set('Authorization', `Bearer ${ownerAccessToken}`)
                        .send({});
                }

                if (i % 3 === 1) {
                    // cancel registration
                    await request(app.getHttpServer())
                        .delete(
                            `/api/v1/registrations/${register.body.data.id}`,
                        )
                        .set('Authorization', `Bearer ${ownerAccessToken}`);
                }

                // if i%2 === 0, then remain pending
            }
        });

        // test: return 20 without cursor without limit
        it('should return first page of registrations with no cursor', async () => {
            const result = await request(app.getHttpServer())
                .get('/api/v1/users/me/registrations')
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            expect(result.statusCode).toBe(200);

            listRegistrationsPageOne = result.body.data;
            nextCursor = listRegistrationsPageOne.at(-1)!.id;

            expect(listRegistrationsPageOne.length).toBe(20);
        });

        // test: return 5 with limit without cursor
        it('should return 5 with limit without cursor', async () => {
            const result = await request(app.getHttpServer())
                .get('/api/v1/users/me/registrations?limit=5')
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            expect(result.statusCode).toBe(200);
            expect(result.body.data.length).toBe(5);
        });

        // test: return 5 with limit without cursor for PENDING
        it('should return 5 with limit without cursor for PENDING', async () => {
            const result = await request(app.getHttpServer())
                .get('/api/v1/users/me/registrations?limit=5&status=pending')
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            expect(result.statusCode).toBe(200);
            expect(result.body.data.length).toBe(5);
        });

        // test: return 5 with limit without cursor for CONFIRMED
        it('should return 5 with limit without cursor for CONFIRMED', async () => {
            const result = await request(app.getHttpServer())
                .get('/api/v1/users/me/registrations?limit=5&status=confirmed')
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            expect(result.statusCode).toBe(200);
            expect(result.body.data.length).toBe(5);
        });

        // test: return 5 with limit without cursor for CANCELLED
        it('should return 5 with limit without cursor for CANCELLED', async () => {
            const result = await request(app.getHttpServer())
                .get('/api/v1/users/me/registrations?limit=5&status=cancelled')
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            expect(result.statusCode).toBe(200);
            expect(result.body.data.length).toBe(5);
        });

        // test: return registrations with cursor (but limit to 5)
        it('should return 5 with limit and cursor', async () => {
            const result = await request(app.getHttpServer())
                .get(
                    `/api/v1/users/me/registrations?cursor=${nextCursor}&limit=5`,
                )
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            const newList = result.body.data;

            expect(result.statusCode).toBe(200);
            expect(newList.length).toBe(5);

            // algorithm to prevent duplication
            const bIds = new Set(
                listRegistrationsPageOne.map((item: Registration) => item.id),
            );
            const isDuplication = newList.some((item: Registration) =>
                bIds.has(item.id),
            );

            expect(isDuplication).toBe(false);
        });
    });

    describe('Confirm Registration', () => {
        let adminAccessToken: string;

        beforeAll(async () => {
            // create an admin for the org
            const admin = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'admin-reg-e2e-test@test.com',
                    password: 'password123',
                    displayName: 'Registration as Admin E2E User',
                });

            adminAccessToken = admin.body.data.accessToken;

            // add member as Admin
            const addMember = await request(app.getHttpServer())
                .post(`/api/v1/organizations/${orgId}/members`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    userId: admin.body.data.user.id,
                    role: 'ADMIN',
                });

            // console.error(addMember);
        });

        // have the admin to confirm user 2's registration
        it('confirm the other user registration by Admin', async () => {
            const result = await request(app.getHttpServer())
                .patch(`/api/v1/registrations/${user2RegistrationId}/confirm`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send({});

            expect(result.statusCode).toBe(200);
        });
    });

    describe('Find by Id', () => {
        it('should return registration by id', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/registrations/${registrationId}`)
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.id).toBe(registrationId);
        });
    });
});
