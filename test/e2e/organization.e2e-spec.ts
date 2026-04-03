import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import request from 'supertest';
import { Organization } from "@prisma/client";

/**
 *  - Register a user, create an org, verify OWNER membership was auto-created
    - Get org by slug
    - Update org (as OWNER)
    - Try to update org as non-member (should 403)
    - Delete org (soft delete)
    - List orgs with pagination
 */
describe('Organization (e2e)', () => {
    let app: INestApplication;
    let accessToken: string;

    let orgSaved: Organization

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule]
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api/v1');
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Register a user, create an org, verify OWNER membership was auto-created', () => {
        /**
         * Step 1: Register user
         * Step 2: Create an org using that user
         * Step 3: Verify if membership was auto-created and that user is OWNER
         */


        // Step 1
        it('POST /auth/register - should register a new user', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'org-test@test.com',
                    password: 'password123',
                    displayName: 'E2E Org Test'
                })
                .expect(201)
                .expect((res) => {
                    accessToken = res.body.data.accessToken;
                });
        });

        // Step 2 and 3
        it('should register a new organization and verify if user is owner', async () => {
            const orgRes = await request(app.getHttpServer())
                .post('/api/v1/organizations')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Test Org',
                    description: 'E2E testing org.'
                });

            // Register the org with the user
            expect(orgRes.statusCode).toBe(201);
            expect(orgRes.body.data.name).toBe('Test Org');
            expect(orgRes.body.data.description).toBe('E2E testing org.');

            // save org to be used later
            orgSaved = orgRes.body.data;

            const membership = await request(app.getHttpServer())
                .get(`/api/v1/organizations/${orgRes.body.data.id}/members/find`)
                .set('Authorization', `Bearer ${accessToken}`);

            // test if membership is OWNER of that org
            expect(membership.statusCode).toBe(200);
            expect(membership.body.data.role).toBe('OWNER');
        });
    });

    describe('Find org by slug', () => {
        it('should GET org by slug', async () => {
            const org = await request(app.getHttpServer())
                .get(`/api/v1/organizations/${orgSaved.slug}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(org.statusCode).toBe(200);
            expect(org.body.data.name).toBe('Test Org');
            expect(org.body.data.description).toBe('E2E testing org.');
        });
    });

    describe('Update org', () => {
        it('should be able to update org as owner', async () => {
            const org = await request(app.getHttpServer())
                .patch(`/api/v1/organizations/${orgSaved.id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'New name',
                    description: 'New Description'
                });

            expect(org.statusCode).toBe(200);
            expect(org.body.data.name).toBe('New name');
            expect(org.body.data.description).toBe('New Description');
        });

        it('Try to update org as non-member (should 403)', async () => {
            const nonMemberUser = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'non-member@test.com',
                    password: 'password123',
                    displayName: 'E2E Org Test Non Member'
                });

            const org = await request(app.getHttpServer())
                .patch(`/api/v1/organizations/${orgSaved.id}`)
                .set('Authorization', `Bearer ${nonMemberUser.body.data.accessToken}`)
                .send({
                    name: 'New name',
                    description: 'New Description'
                });

            expect(org.statusCode).toBe(403);
        });
    });

    describe('Delete org (soft delete)', () => {
        it('should delete org but soft delete only', async () => {
            const org = await request(app.getHttpServer())
                .delete(`/api/v1/organizations/${orgSaved.id}`)
                .set('Authorization', `Bearer ${accessToken}`)

            expect(org.statusCode).toBe(200);
            expect(org.body.data.deletedAt).not.toBeNull();
        });
    });

    describe('List Org', () => {
        let listOrgs: Organization[] = [];
        let cursorFromPageOne: string;

        beforeAll(async () => {
            for (let i = 0; i < 30; i++) {
                await request(app.getHttpServer())
                    .post('/api/v1/organizations')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({
                        name: `Test Org ${i}`,
                        description: 'E2E testing org.'
                    });
            }
        });

        it('should return first page of orgs (no cursor)', async () => {
            const result = await request(app.getHttpServer())
                .get('/api/v1/organizations?limit=5')
                .set('Authorization', `Bearer ${accessToken}`);

            // this is page 1 data
            listOrgs = result.body.data;
            cursorFromPageOne = result.body.meta.cursor;

            expect(result.statusCode).toBe(200);
            expect(result.body.data.length).toBe(5);
        });

        it('should return NEXT page using cursor from last item of previous page', async () => {
            const result = await request(app.getHttpServer())
                .get(`/api/v1/organizations?cursor=${cursorFromPageOne}&limit=5`)
                .set('Authorization', `Bearer ${accessToken}`);


            // Check if all the items are not the same
            const newList = result.body.data;

            const bIds = new Set(newList.map(((item: Organization) => item.id)));
            const same = listOrgs.length === newList.length && listOrgs.every((item: Organization) => bIds.has(item.id));

            expect(same).toBe(false);
            expect(result.body.data.length).toBe(5);
        });

        it('should return empty array when cursor is past the last item', async () => {
            // use the very last item as cursor - nothing comes after it.
            const limit = 5;
            let cursor: string | undefined;
            let lastNonEmptyCursor: string | undefined;

            while(true){
                const res = await request(app.getHttpServer())
                .get(`/api/v1/organizations?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`)
                .set('Authorization', `Bearer ${accessToken}`);

                if(res.body.data.length === 0){
                    break;
                }

                lastNonEmptyCursor = res.body.meta.cursor;
                cursor = lastNonEmptyCursor;
            }

            const final = await request(app.getHttpServer())
                .get(`/api/v1/organizations?cursor=${lastNonEmptyCursor}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(final.body.data.length).toBe(0)
        });
    });
});