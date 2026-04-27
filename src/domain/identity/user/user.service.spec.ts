import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
    let service: UserService;

    // Fake user data to reuse in tests
    const mockUser = {
        id: '123',
        email: 'test@test.com',
        password: '$2b$12$fakehash',
        displayName: 'Test User',
        avatar: null,
        bio: null,
        role: 'USER',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Fake PrismaService — fake every Prisma method your service calls
    /**
     * Unsay rule of thumb sa pag create??
     * Ang ibutang nimo diri na mga fake functions kay kung
     * unsa ang mga functions itself.
     *
     * So sa mock prisma, ang functions itself sa prisma kay
     * create, findunique, create, etc.
     *
     * So mao sad ang imo i mock.
     */
    const mockPrisma = {
        user: {
            create: jest.fn(), // jest.fn() = fake function you control
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    /** This runs bago pa na run ang test.
     * So ang imung prisma service, na mock na sya daan bago
     * pa nidagan ang test.
     */
    beforeEach(async () => {
        // NestJS testing module — wires up DI with your fakes instead of real services
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        // ang service na imung gina test is ang UserService only
        service = module.get<UserService>(UserService);
        jest.resetAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-04-27T07:32:11.223Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });
    describe('findById', () => {
        it('should return user without password', async () => {
            // 1. ARRANGE: tell the fake what to return
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            // 2. ACT: call the real service method
            const result = await service.findById('123');

            // 3. ASSERT: check the result
            expect(result).not.toHaveProperty('password');
            expect(result.email).toBe('test@test.com');
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await expect(service.findById('999')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    // NOW YOU WRITE THESE:

    describe('findByEmail', () => {
        // Test: returns user (WITH password) when found
        it('should return user with password when found', async () => {
            // Arrange
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            // Act
            const result = await service.findByEmail('test@test.com');

            // Assert
            expect(result).toHaveProperty('password');
            expect(result?.email).toBe('test@test.com');
        });

        // Test: returns null when not found
        it('should return null when user is not found', async () => {
            // Arrange
            mockPrisma.user.findUnique.mockResolvedValue(null);

            // Act
            const result = await service.findByEmail('notfound@test.com');

            // Assert
            expect(result).toBe(null);
        });
    });

    describe('exists', () => {
        // Test: returns true when user exists
        it('should return true when user exists', async () => {
            // Arrange
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'someuniqueid',
            });

            // Act
            const result = await service.exists('someuniqueid');

            // Assert
            expect(result).toBe(true);
        });

        // Test: returns false when user doesn't exist
        it('it should return false when user does not exist', async () => {
            // Arrange
            mockPrisma.user.findUnique.mockResolvedValue(null);

            // Act
            const result = await service.exists('notfound@test.com');

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('create', () => {
        // Test: calls prisma.user.create, returns user WITHOUT password
        it('should create user and return it without password', async () => {
            // Arrange
            mockPrisma.user.create.mockResolvedValue(mockUser);

            // Act
            const result = await service.create({
                email: 'test@test.com',
                password: 'somepasswordhash',
                displayName: 'mickeymouse',
            });

            // Assert
            expect(result).not.toHaveProperty('password');
            expect(result).toEqual({ ...mockUser, password: undefined });
        });

        // Hint: mockPrisma.user.create.mockResolvedValue(mockUser)
        // Hint: check that result doesn't have 'password' property
    });

    describe('update', () => {
        // Test: calls prisma.user.update with correct args, returns user WITHOUT password
        it('should update and return user without password', async () => {
            // Arrange
            mockPrisma.user.update.mockResolvedValue(mockUser);

            // Act
            const result = await service.update('someid', {
                displayName: 'newDisplayName',
            });

            // Assert
            expect(result).not.toHaveProperty('password');
            expect(result).toEqual({ ...mockUser, password: undefined });
        });
    });
});
