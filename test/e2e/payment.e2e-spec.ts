import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { PaymentMethod, RegistrationStatus, User } from '@prisma/client';
import { ReviewAction } from '../../src/domain/event/payment/dto/review-payment.dto';

interface ResponseAuthUser {
    accessToken: string;
    user: User;
}

describe('Payment (e2e)', () => {
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

    /**
     * Create:
     * - normal user (register a race)
     * - admin user (reviewer)
     * - another user (ownership test)
     * - an org with the admin as OWNER
     * - create event
     * - a paid race (price: 50000)
     * - a free race (price: 0)
     * - publish event
     * - registrations for both race
     */
    let normalUser: ResponseAuthUser;
    let adminUser: ResponseAuthUser;
    let ownershipTestUser: ResponseAuthUser;

    let orgId: string;
    let eventId: string;
    let paidRaceId: string;
    let freeRaceId: string;

    let registrationPaidRaceId: string;
    let registrationFreeRaceId: string;

    let paymentId: string;

    // 2nd and 3rd test suite (Payment Validation & Payment retry and auto-cancel)
    let registrationPaymentValidationId: string;
    let paymentPaymentValidationId: string;

    beforeAll(async () => {
        // normal user
        const user1 = await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({
                email: `payment-e2e-test@test.com`,
                password: 'password123',
                displayName: `Payment E2E User`,
            });

        normalUser = {
            accessToken: user1.body.data.accessToken,
            user: user1.body.data.user,
        };

        // admin user
        const user2 = await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({
                email: `payment-admin-e2e-test@test.com`,
                password: 'password123',
                displayName: `Payment Admin E2E User`,
            });

        adminUser = {
            accessToken: user2.body.data.accessToken,
            user: user2.body.data.user,
        };

        // ownership user test
        const user3 = await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({
                email: `payment-ownershiptest-e2e-test@test.com`,
                password: 'password123',
                displayName: `Payment Ownership Test E2E User`,
            });

        ownershipTestUser = {
            accessToken: user3.body.data.accessToken,
            user: user3.body.data.user,
        };

        // create org as admin
        const orgRes = await request(app.getHttpServer())
            .post('/api/v1/organizations')
            .set('Authorization', `Bearer ${adminUser.accessToken}`)
            .send({
                name: 'Payment Test Org',
                description: 'E2E payment testing org.',
            });

        orgId = orgRes.body.data.id;

        // create unpublished event
        const event = await request(app.getHttpServer())
            .post(`/api/v1/events/${orgId}`)
            .set('Authorization', `Bearer ${adminUser.accessToken}`)
            .send({
                name: 'Payment Test Event',
                startDate: '2026-07-01',
                endDate: '2026-07-02',
            });

        eventId = event.body.data.id;

        // create paid race
        const paidRace = await request(app.getHttpServer())
            .post(`/api/v1/events/${eventId}/races`)
            .set('Authorization', `Bearer ${adminUser.accessToken}`)
            .send({
                name: 'Payment Race Test',
                distance: 123.45,
                unit: 'test-unit',
                maxParticipants: 500,
                price: 50000,
            });

        paidRaceId = paidRace.body.data.id;

        // create free race
        const freeRace = await request(app.getHttpServer())
            .post(`/api/v1/events/${eventId}/races`)
            .set('Authorization', `Bearer ${adminUser.accessToken}`)
            .send({
                name: 'Payment Race Test',
                distance: 123.45,
                unit: 'test-unit',
                maxParticipants: 500,
                price: 0,
            });

        freeRaceId = freeRace.body.data.id;

        // publish event to open registration
        await request(app.getHttpServer())
            .patch(`/api/v1/events/${eventId}/status`)
            .set('Authorization', `Bearer ${adminUser.accessToken}`)
            .send({
                status: 'PUBLISHED',
            });

        // register normal user to paid race
        const regPaid = await request(app.getHttpServer())
            .post(`/api/v1/races/${paidRaceId}/registrations`)
            .set('Authorization', `Bearer ${normalUser.accessToken}`)
            .send({});

        registrationPaidRaceId = regPaid.body.data.id;

        // register normal user to paid race
        const regFree = await request(app.getHttpServer())
            .post(`/api/v1/races/${freeRaceId}/registrations`)
            .set('Authorization', `Bearer ${normalUser.accessToken}`)
            .send({});

        registrationFreeRaceId = regFree.body.data.id;
    });

    describe('Payment submission and approval', () => {
        it('should submit payment for a pending registration', async () => {
            const result = await request(app.getHttpServer())
                .post(
                    `/api/v1/registrations/${registrationPaidRaceId}/payments`,
                )
                .set('Authorization', `Bearer ${normalUser.accessToken}`)
                .send({
                    method: PaymentMethod.GCASH,
                    amount: 50000,
                    currency: 'PHP',
                    proofImage: 'https://example.com/image.jpg',
                });

            expect(result.statusCode).toBe(201);

            paymentId = result.body.data.id;
        });

        it('should approve the payment and auto-confirm registration', async () => {
            const result = await request(app.getHttpServer())
                .patch(`/api/v1/payments/${paymentId}/review`)
                .set('Authorization', `Bearer ${adminUser.accessToken}`)
                .send({
                    action: ReviewAction.APPROVE,
                });

            expect(result.statusCode).toBe(200);
        });
    });

    describe('Payment validation', () => {
        beforeAll(async () => {
            // create unpublished event
            const event = await request(app.getHttpServer())
                .post(`/api/v1/events/${orgId}`)
                .set('Authorization', `Bearer ${adminUser.accessToken}`)
                .send({
                    name: 'Second Payment Test Event',
                    startDate: '2026-07-01',
                    endDate: '2026-07-02',
                });

            // create race
            const race = await request(app.getHttpServer())
                .post(`/api/v1/events/${event.body.data.id}/races`)
                .set('Authorization', `Bearer ${adminUser.accessToken}`)
                .send({
                    name: 'Second Payment Race Test',
                    distance: 123.45,
                    unit: 'test-unit',
                    maxParticipants: 500,
                    price: 50000,
                });

            // publish event to open registration
            await request(app.getHttpServer())
                .patch(`/api/v1/events/${event.body.data.id}/status`)
                .set('Authorization', `Bearer ${adminUser.accessToken}`)
                .send({
                    status: 'PUBLISHED',
                });

            // register normal user to paid race
            const registration = await request(app.getHttpServer())
                .post(`/api/v1/races/${race.body.data.id}/registrations`)
                .set('Authorization', `Bearer ${normalUser.accessToken}`)
                .send({});

            registrationPaymentValidationId = registration.body.data.id;
        });

        it('should return 403 when submitting for someone elses registration', async () => {
            const result = await request(app.getHttpServer())
                .post(
                    `/api/v1/registrations/${registrationPaymentValidationId}/payments`,
                )
                .set('Authorization', `Bearer ${ownershipTestUser.accessToken}`)
                .send({
                    method: PaymentMethod.GCASH,
                    amount: 50000,
                    currency: 'PHP',
                    proofImage: 'https://example.com/image.jpg',
                });

            expect(result.statusCode).toBe(403);
        });

        it('should return 400 when amount does not match', async () => {
            const result = await request(app.getHttpServer())
                .post(
                    `/api/v1/registrations/${registrationPaymentValidationId}/payments`,
                )
                .set('Authorization', `Bearer ${normalUser.accessToken}`)
                .send({
                    method: PaymentMethod.GCASH,
                    amount: 40000,
                    currency: 'PHP',
                    proofImage: 'https://example.com/image.jpg',
                });

            expect(result.statusCode).toBe(400);
        });

        it('should return 409 when payment already active', async () => {
            // pay the registration successfully
            const payment = await request(app.getHttpServer())
                .post(
                    `/api/v1/registrations/${registrationPaymentValidationId}/payments`,
                )
                .set('Authorization', `Bearer ${normalUser.accessToken}`)
                .send({
                    method: PaymentMethod.GCASH,
                    amount: 50000,
                    currency: 'PHP',
                    proofImage: 'https://example.com/image.jpg',
                });

            paymentPaymentValidationId = payment.body.data.id;

            const result = await request(app.getHttpServer())
                .post(
                    `/api/v1/registrations/${registrationPaymentValidationId}/payments`,
                )
                .set('Authorization', `Bearer ${normalUser.accessToken}`)
                .send({
                    method: PaymentMethod.GCASH,
                    amount: 50000,
                    currency: 'PHP',
                    proofImage: 'https://example.com/image.jpg',
                });

            expect(result.statusCode).toBe(409);
        });

        it('should return 403 when non-admin tries to review', async () => {
            const result = await request(app.getHttpServer())
                .patch(`/api/v1/payments/${paymentPaymentValidationId}/review`)
                .set('Authorization', `Bearer ${ownershipTestUser.accessToken}`)
                .send({
                    action: ReviewAction.APPROVE,
                });

            expect(result.statusCode).toBe(403);
        });

        it('should return 400 when rejecting without reason', async () => {
            const result = await request(app.getHttpServer())
                .patch(`/api/v1/payments/${paymentPaymentValidationId}/review`)
                .set('Authorization', `Bearer ${adminUser.accessToken}`)
                .send({
                    action: ReviewAction.REJECT,
                });

            expect(result.statusCode).toBe(400);
        });
    });

    describe('Payment retry and auto-cancel', () => {
        let secondPaymentId: string;

        it('should allow retry after rejection', async () => {
            // reject the first payment
            await request(app.getHttpServer())
                .patch(`/api/v1/payments/${paymentPaymentValidationId}/review`)
                .set('Authorization', `Bearer ${adminUser.accessToken}`)
                .send({
                    action: ReviewAction.REJECT,
                    rejectionReason: 'First rejection of payment',
                });

            // pay again the second time
            const result = await request(app.getHttpServer())
                .post(
                    `/api/v1/registrations/${registrationPaymentValidationId}/payments`,
                )
                .set('Authorization', `Bearer ${normalUser.accessToken}`)
                .send({
                    method: PaymentMethod.GCASH,
                    amount: 50000,
                    currency: 'PHP',
                    proofImage: 'https://example.com/image.jpg',
                });

            secondPaymentId = result.body.data.id;

            expect(result.statusCode).toBe(201);
        });

        it('should auto-cancel registration after 3 rejections', async () => {
            // reject the second payment
            await request(app.getHttpServer())
                .patch(`/api/v1/payments/${secondPaymentId}/review`)
                .set('Authorization', `Bearer ${adminUser.accessToken}`)
                .send({
                    action: ReviewAction.REJECT,
                    rejectionReason: 'Second rejection of payment',
                });

            // pay again the third time
            const result1 = await request(app.getHttpServer())
                .post(
                    `/api/v1/registrations/${registrationPaymentValidationId}/payments`,
                )
                .set('Authorization', `Bearer ${normalUser.accessToken}`)
                .send({
                    method: PaymentMethod.GCASH,
                    amount: 50000,
                    currency: 'PHP',
                    proofImage: 'https://example.com/image.jpg',
                });

            // reject the third payment
            await request(app.getHttpServer())
                .patch(`/api/v1/payments/${result1.body.data.id}/review`)
                .set('Authorization', `Bearer ${adminUser.accessToken}`)
                .send({
                    action: ReviewAction.REJECT,
                    rejectionReason: 'Third rejection of payment',
                });

            const registration = await request(app.getHttpServer())
                .get(`/api/v1/registrations/${registrationPaymentValidationId}`)
                .set('Authorization', `Bearer ${adminUser.accessToken}`);

            expect(registration.body.data.status).toBe(
                RegistrationStatus.CANCELLED,
            );
        });
    });

    describe('Admin payment queue', () => {
        it('should list payments for an event', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/events/${eventId}/payments`)
                .set('Authorization', `Bearer ${adminUser.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
        });

        it('should filter payments by status', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/events/${eventId}/payments?status=APPROVED`)
                .set('Authorization', `Bearer ${adminUser.accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
        });

        it('should return 403 for non-admin', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/v1/events/${eventId}/payments`)
                .set(
                    'Authorization',
                    `Bearer ${ownershipTestUser.accessToken}`,
                );

            expect(res.statusCode).toBe(403);
        });
    });
});
