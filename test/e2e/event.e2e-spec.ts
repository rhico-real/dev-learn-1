import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { Event } from '@prisma/client';

describe('Event (e2e)', () => {
    let app: INestApplication;

    let ownerAccessToken: string;
    let nonMemberAccessToken: string;

    let orgId: string;

    let event: Event;

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

    // create
    /**
     * Create user
     * Create org
     * Create event (as OWNER)
     * Try creating event as non-member (403)
     */
    describe('Create Event', () => {
        beforeAll(async () => {
            // create owner
            const owner = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'owner-event-test@test.org',
                    password: 'password123',
                    displayName: 'Event test Owner',
                });

            ownerAccessToken = owner.body.data.accessToken;

            // create non member
            const nonmember = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'non-member-event-test@test.org',
                    password: 'password123',
                    displayName: 'Event test Non Member',
                });

            nonMemberAccessToken = nonmember.body.data.accessToken;

            // create org
            const org = await request(app.getHttpServer())
                .post('/api/v1/organizations')
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    name: 'Event Test Org',
                    description: 'Event E2E testing org.',
                });

            orgId = org.body.data.id;
        });

        it('should be able to create event as owner', async () => {
            const result = await request(app.getHttpServer())
                .post(`/api/v1/events/${orgId}`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    name: 'Test Event',
                    startDate: '2026-06-01',
                    endDate: '2026-06-02',
                });

            event = result.body.data;

            expect(result.statusCode).toBe(201);
            expect(result.body.data.name).toBe('Test Event');
        });

        it('should return 403 if create event as non-member', async () => {
            const result = await request(app.getHttpServer())
                .post(`/api/v1/events/${orgId}`)
                .set('Authorization', `Bearer ${nonMemberAccessToken}`)
                .send({
                    name: 'Test Event 2',
                    startDate: '2026-06-01',
                    endDate: '2026-06-02',
                });

            expect(result.statusCode).toBe(403);
        });
    });

    // get event by slug
    describe('get event by slug', () => {
        it('should get event by slug', async () => {
            const result = await request(app.getHttpServer())
                .get(`/api/v1/events/${event.slug}`)
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            expect(result.statusCode).toBe(200);
            expect(result.body.data.slug).toBe(event.slug);
        });
    });

    // update event
    describe('update event', () => {
        it('should be able to update event', async () => {
            const result = await request(app.getHttpServer())
                .patch(`/api/v1/events/${event.id}`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    name: 'Updated Event',
                    description: 'Updated description',
                    location: 'updated-location',
                    bannerImage: 'updated-banner-image',
                    startDate: '2026-06-02',
                    endDate: '2026-06-03',
                });

            expect(result.statusCode).toBe(200);
            expect(result.body.data.name).toBe('Updated Event');
        });
    });

    // update event status
    /**
     * Status transitions: DRAFT -> PUBLISHED -> CLOSED -> COMPLETED
     * Try invalid transitions (DRAFT -> CLOSED, should 400)
     */
    describe('update status', () => {
        it('should return 400 if updating DRAFT -> CLOSED', async () => {
            const result = await request(app.getHttpServer())
                .patch(`/api/v1/events/${event.id}/status`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    status: 'CLOSED',
                });

            expect(result.status).toBe(400);
        });

        it('should be able to update DRAFT -> PUBLISHED', async () => {
            const result = await request(app.getHttpServer())
                .patch(`/api/v1/events/${event.id}/status`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    status: 'PUBLISHED',
                });

            expect(result.statusCode).toBe(200);
            expect(result.body.data.status).toBe('PUBLISHED');
        });

        it('should be able to update PUBLISHED -> CLOSED', async () => {
            const result = await request(app.getHttpServer())
                .patch(`/api/v1/events/${event.id}/status`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    status: 'CLOSED',
                });

            expect(result.statusCode).toBe(200);
            expect(result.body.data.status).toBe('CLOSED');
        });

        it('should be able to update CLOSED -> COMPLETED', async () => {
            const result = await request(app.getHttpServer())
                .patch(`/api/v1/events/${event.id}/status`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    status: 'COMPLETED',
                });

            expect(result.statusCode).toBe(200);
            expect(result.body.data.status).toBe('COMPLETED');
        });
    });

    // delete
    /**
     * Delete draft event
     * Try deleteing published event (400)
     */
    describe('delete event', () => {
        let draftEvent: Event;
        let publishedEvent: Event;

        // create 2 events: 1 draft event and 1 published event
        beforeAll(async () => {
            const draft = await request(app.getHttpServer())
                .post(`/api/v1/events/${orgId}`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    name: 'Test Draft Event',
                    startDate: '2026-06-01',
                    endDate: '2026-06-02',
                });

            draftEvent = draft.body.data;

            const published = await request(app.getHttpServer())
                .post(`/api/v1/events/${orgId}`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    name: 'Test Draft Event',
                    startDate: '2026-06-01',
                    endDate: '2026-06-02',
                });

            await request(app.getHttpServer())
                .patch(`/api/v1/events/${published.body.data.id}/status`)
                .set('Authorization', `Bearer ${ownerAccessToken}`)
                .send({
                    status: 'PUBLISHED',
                });

            publishedEvent = published.body.data;
        });

        it('should be able to delete draft event', async () => {
            const result = await request(app.getHttpServer())
                .delete(`/api/v1/events/${draftEvent.id}`)
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            expect(result.statusCode).toBe(200);
            expect(result.body.data.status).toBe('DRAFT');
        });

        it('should return 400 if deleting published event', async () => {
            const result = await request(app.getHttpServer())
                .delete(`/api/v1/events/${publishedEvent.id}`)
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            expect(result.statusCode).toBe(400);
        });
    });

    // list published events with pagination
    describe('list published events', () => {
        let listEventsPageOne: Event[];
        let cursorFromPageOne: string;

        // create 30 dummy events
        beforeAll(async () => {
            for (let i = 0; i < 30; i++) {
                // create draft event
                const res = await request(app.getHttpServer())
                    .post(`/api/v1/events/${orgId}`)
                    .set('Authorization', `Bearer ${ownerAccessToken}`)
                    .send({
                        name: `Test Draft Event ${i}`,
                        startDate: '2026-06-01',
                        endDate: '2026-06-02',
                    });

                // update status to publish immediately
                await request(app.getHttpServer())
                    .patch(`/api/v1/events/${res.body.data.id}/status`)
                    .set('Authorization', `Bearer ${ownerAccessToken}`)
                    .send({
                        status: 'PUBLISHED',
                    });
            }
        });

        // test: return 20 without cursor without limit
        it('should return 20 without cursor without limit', async () => {
            const result = await request(app.getHttpServer())
                .get('/api/v1/events')
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            // get list of events from page 1:
            listEventsPageOne = result.body.data;
            cursorFromPageOne = result.body.meta.cursor;

            expect(result.statusCode).toBe(200);
            expect(result.body.data.length).toBe(20);
        });

        // test: return 5 with limit without cursor
        it('should return 5 without cursor with limit', async () => {
            const result = await request(app.getHttpServer())
                .get('/api/v1/events?limit=5')
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            expect(result.statusCode).toBe(200);
            expect(result.body.data.length).toBe(5);
        });

        // test: return events with cursor
        it('should return to NEXT page with cursor', async () => {
            const result = await request(app.getHttpServer())
                .get(`/api/v1/events?cursor=${cursorFromPageOne}&limit=5`)
                .set('Authorization', `Bearer ${ownerAccessToken}`);

            expect(result.statusCode).toBe(200);

            const newList = result.body.data;

            // compare so that there are no repeating events using cursor
            const bIds = new Set(
                listEventsPageOne.map((item: Event) => item.id),
            );
            const same = newList.some((item: Event) => bIds.has(item.id));

            expect(same).toBe(false);
            expect(newList.length).toBe(5);
        });
    });
});
