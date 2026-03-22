import { UserService } from "../user/user.service"

jest.mock('bcrypt', () => ({
    compare: jest.fn()
}));

import * as bcrypt from 'bcrypt';
import { AuthService } from "./auth.service";
import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { RedisService } from "../../../infrastructure/redis/redis.service";
import { ConfigService } from "@nestjs/config";
import { ConflictException, UnauthorizedException } from "@nestjs/common";

jest.mock('uuid', () => ({
    v4: jest.fn().mockReturnValue('mock-uuid')
}));

describe('AuthService', () => {
    let service: AuthService;

    const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        password: '$2b$12$fakehash',
        displayName: 'Test User',
        role: 'USER'
    };

    const mockUserWithoutPassword = {
        id: 'user-123',
        email: 'test@test.com',
        displayName: 'Test User',
        role: 'USER'
    };

    const mockUserService = {
        findByEmail: jest.fn(),
        create: jest.fn(),
        findById: jest.fn()
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('mock-access-token')
    };

    const mockRedisService = {
        setex: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        delByPattern: jest.fn()
    };

    const mockConfigService = {
        get: jest.fn().mockReturnValue(604800)
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UserService, useValue: mockUserService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: RedisService, useValue: mockRedisService },
                { provide: ConfigService, useValue: mockConfigService }
            ]
        }).compile();

        service = module.get<AuthService>(AuthService);
        jest.clearAllMocks();
    });

    describe('register', () => {
        // should create user and return tokens
        it('should create and return tokens', async () => {
            // Arrange
            mockUserService.findByEmail.mockResolvedValue(null);
            mockUserService.create.mockResolvedValue(mockUserWithoutPassword);

            // Act
            const result = await service.register({
                email: 'test@test.com',
                password: '123123',
                displayName: 'Test User'
            });

            // Assert
            expect(result.accessToken).toBe('mock-access-token');
            expect(result.refreshToken).toBeDefined();
            expect(result.user.email).toBe(mockUser.email);
            expect(result.user.displayName).toBe(mockUser.displayName);
            expect(result.user).not.toHaveProperty('password');
            expect(mockRedisService.setex).toHaveBeenCalled();
        });

        it('should throw ConflictException if email already exists', async () => {
            // Arrange
            mockUserService.findByEmail.mockResolvedValue(mockUser);

            // Act and Assert
            await expect(service.register({
                email: 'test@test.com',
                password: '123123',
                displayName: 'Test User'
            })).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        // should return tokens for valid credentials
        it('should return tokens for valid credentials', async () => {
            // Arrange
            mockUserService.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            // Act
            const result = await service.login({ email: 'test@test.com', password: '123123' });

            // Assert
            expect(result.accessToken).toBe('mock-access-token');
            expect(result.refreshToken).toBeDefined();
            expect(result.user).not.toHaveProperty('password');
        });

        // Test: throws UnauthorizedException for non-existent email
        it('should throw UnauthorizedException for non-existent email', async () => {
            // Arrange
            mockUserService.findByEmail.mockResolvedValue(null);

            // Act and Assert
            await expect(service.login({ email: 'test@test.com', password: '123123' })).rejects.toThrow(UnauthorizedException);
        });

        // Test: throws UnauthorizedException for wrong password
        it('should throw UnauthorizedException for wrong password', async () => {
            // Arrange
            mockUserService.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            // Act and Assert
            await expect(service.login({ email: 'test@test.com', password: '123123' })).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('refresh', () => {
        // Test: validates refresh token from Redis, returns new token pair
        it('validates refresh token from Redis and returns a new token pair', async () => {
            // Arrange
            mockRedisService.get.mockResolvedValue('valid');
            mockRedisService.del.mockResolvedValue(1);
            mockUserService.findById.mockResolvedValue(mockUser);

            // Act
            const result = await service.refresh({ refreshToken: 'refresh-token' });

            // Assert
            expect(result.accessToken).toBe('mock-access-token');
            expect(result.refreshToken).toBeDefined();
        });

        // Test: throws UnauthorizedException for invalid/expired refresh token
        it('should throw UnauthorizedException for invalid/expired refresh token', async () => {
            // Arrange
            mockRedisService.get.mockResolvedValue(null)

            // Act and Assert
            await expect(service.refresh({ refreshToken: 'refresh-token' })).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('logout', () => {
        // Test: blacklists access token jti in Redis, deletes refresh token
        it('should blacklist access token jti in Redis and delete the refresh token', async () => {
            // Arrange
            mockConfigService.get.mockReturnValue(900);

            // Act
            await service.logout('sample-jti', 'my-user-id');

            // Assert
            expect(mockRedisService.setex).toHaveBeenCalledWith('auth:blacklist:sample-jti', 900, 'revoke');
            expect(mockRedisService.delByPattern).toHaveBeenCalledWith('auth:refresh:my-user-id:*');
        });
    });
})