import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import request from 'supertest';

describe('Auth (e2e)', () => {
    let app: INestApplication;

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

    it('POST /auth/register - should register a new user', () => {
        return request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({
                email: 'e2e-test@test.com',
                password: 'password123',
                displayName: 'E2E User'
            })
            .expect(201)
            .expect((res) => {
                expect(res.body.accessToken).toBeDefined();
                expect(res.body.refreshToken).toBeDefined();
                expect(res.body.user.email).toBe('e2e-test@test.com');
            });
    });

    // POST /auth/register - should reject duplicate email
    it('POST /auth/register - should reject duplicate email', () => {
        return request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({
                email: 'e2e-test@test.com',
                password: 'password123',
                displayName: 'E2E User'
            })
            .expect(HttpStatus.CONFLICT);
    });

    // Test: POST /auth/login — should return tokens for valid credentials
    it('POST /auth/login - should return tokens for valid credentials', () => {
        return request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({
                email: 'e2e-test@test.com',
                password: 'password123',
            })
            .expect(HttpStatus.OK)
            .expect((res) => {
                expect(res.body.accessToken).toBeDefined();
                expect(res.body.refreshToken).toBeDefined()
            });
    });

    // Test: POST /auth/login — should reject invalid password (401)
    it('POST /auth/login - should reject invalid password (401)', () => {
        return request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({
                email: 'e2e-test@test.com',
                password: 'password1234',
            })
            .expect(HttpStatus.UNAUTHORIZED);
    });

    // Test: POST /auth/refresh — should return new tokens
    it('POST /auth/refresh - should return new tokens', () => {
        return request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .send({

            })
    });
    // Test: POST /auth/logout — should blacklist access token
    // Test: After logout, using the old token should return 401
})