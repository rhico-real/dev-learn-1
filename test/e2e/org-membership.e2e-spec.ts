import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import request from 'supertest';

describe('OrgMembership', () => {
    let app: INestApplication;

    let ownerId: string;
    let ownerAccesstoken: string;

    let adminId: string;
    let adminAccesstoken: string;

    let memberId: string;

    let orgId: string;

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

    describe('Add a member', () => {
        beforeAll(async () => {
            // register an owner
            const owner = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'owner-membership@test.org',
                    password: 'password123',
                    displayName: 'Owner Membership',
                });

            ownerId = owner.body.data.user.id;
            ownerAccesstoken = owner.body.data.accessToken;

            // register an admin
            const admin = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'admin-membership@test.org',
                    password: 'password123',
                    displayName: 'Admin Membership',
                });

            adminId = admin.body.data.user.id;
            adminAccesstoken = admin.body.data.accessToken;

            // register a member
            const member = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'member-membership@test.org',
                    password: 'password123',
                    displayName: 'Member Membership',
                });

            memberId = member.body.data.user.id;

            // create an org
            const orgRes = await request(app.getHttpServer())
                .post('/api/v1/organizations')
                .set('Authorization', `Bearer ${ownerAccesstoken}`)
                .send({
                    name: 'Test Org Membership',
                    description: 'E2E testing org membership.',
                });

            orgId = orgRes.body.data.id;
        });

        // add a member
        it('should create and return org membership', async () => {
            const result = await request(app.getHttpServer())
                .post(`/api/v1/organizations/${orgId}/members`)
                .set('Authorization', `Bearer ${ownerAccesstoken}`)
                .send({
                    userId: memberId,
                });

            expect(result.statusCode).toBe(201);
            expect(result.body.data.userId).toBe(memberId);
        });

        // try adding duplicate member (should 409)
        it('should try adding duplicate member and result to 409)', async () => {
            const result = await request(app.getHttpServer())
                .post(`/api/v1/organizations/${orgId}/members`)
                .set('Authorization', `Bearer ${ownerAccesstoken}`)
                .send({
                    userId: memberId,
                });

            expect(result.statusCode).toBe(409);
        });
    });

    describe('Update Member', () => {
        beforeAll(async () => {
            // add admin to the org
            await request(app.getHttpServer())
                .post(`/api/v1/organizations/${orgId}/members`)
                .set('Authorization', `Bearer ${ownerAccesstoken}`)
                .send({
                    userId: adminId,
                    role: 'ADMIN',
                });
        });

        // update member role (as owner)
        it('should update member role as owner', async () => {
            const result = await request(app.getHttpServer())
                .patch(`/api/v1/organizations/${orgId}/members/${memberId}`)
                .set('Authorization', `Bearer ${ownerAccesstoken}`)
                .send({
                    role: 'ADMIN',
                });

            expect(result.statusCode).toBe(200);
            expect(result.body.data.userId).toBe(memberId);
            expect(result.body.data.role).toBe('ADMIN');
        });

        // try updating role as admin (should 403)
        /**
         * Process:
         * 1. Create an ADMIN user
         * 2. Use the ADMIN user to update role of member (or anybody) -> should return 403
         */
        it('try updating role as admin and it should return 403', async () => {
            const result = await request(app.getHttpServer())
                .patch(`/api/v1/organizations/${orgId}/members/${memberId}`)
                .set('Authorization', `Bearer ${adminAccesstoken}`)
                .send({
                    role: 'ADMIN',
                });

            expect(result.statusCode).toBe(403);
        });
    });

    describe('Remove member', () => {
        // remove a member
        it('should remove a member', async () => {
            const result = await request(app.getHttpServer())
                .delete(`/api/v1/organizations/${orgId}/members/${memberId}`)
                .set('Authorization', `Bearer ${ownerAccesstoken}`);

            expect(result.statusCode).toBe(200);
            expect(result.body.data.userId).toBe(memberId);
        });

        // try removing owner (should 403)
        it('try removing owner and should be 403)', async () => {
            const result = await request(app.getHttpServer())
                .delete(`/api/v1/organizations/${orgId}/members/${ownerId}`)
                .set('Authorization', `Bearer ${adminAccesstoken}`);

            expect(result.statusCode).toBe(403);
        });
    });
});
