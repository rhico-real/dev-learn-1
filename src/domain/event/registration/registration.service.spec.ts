import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationService } from './registration.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RaceService } from '../race/race.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('RegistrationService', () => {
    let service: RegistrationService;

    const mockPrisma = {
        registration: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        race: {
            findUnique: jest.fn(),
        },
    };

    const mockRaceService = {
        checkCapacity: jest.fn(),
    };

    const mockEvent = {
        id: 'event-id-123',
        orgId: 'some-org-id',
        name: 'Test Event',
        slug: 'test-event',
        status: 'PUBLISHED',
    };

    const mockRace = {
        id: 'race-id-123',
        eventId: 'event-id-123',
        name: 'Test Race',
        distance: 123.45,
        unit: 'some-unit',
        maxParticipants: 500,
        price: 1000,
        event: mockEvent,
    };

    // draft
    const mockEventDraft = {
        id: 'event-id-123',
        orgId: 'some-org-id',
        name: 'Test Event',
        slug: 'test-event',
        status: 'DRAFT',
    };

    const mockRaceWithDraftEvent = {
        id: 'race-id-123',
        eventId: 'event-id-123',
        name: 'Test Race',
        distance: 123.45,
        unit: 'some-unit',
        maxParticipants: 500,
        price: 1000,
        event: mockEventDraft,
    };

    const mockRegistration = {
        id: 'reg-id-123',
        userId: 'user-id-123',
        raceId: 'race-id-123',
        status: 'PENDING',
        registeredAt: new Date('2026-04-07'),
    };

    const mockCapacityAvailable = {
        available: true,
        remaining: 499,
    };

    const mockCapacityUnavailable = {
        available: false,
        remaining: 0,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RegistrationService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: RaceService, useValue: mockRaceService },
            ],
        }).compile();

        service = module.get<RegistrationService>(RegistrationService);
        jest.clearAllMocks();
    });

    // create
    describe('create registration', () => {
        it('should be able to create registration', async () => {
            mockPrisma.race.findUnique.mockResolvedValue(mockRace);
            mockRaceService.checkCapacity.mockResolvedValue(
                mockCapacityAvailable,
            );
            mockPrisma.registration.create.mockResolvedValue(mockRegistration);

            const result = await service.create('user-id-123', 'race-id-123');

            expect(result).toEqual(mockRegistration);
            await expect(mockPrisma.registration.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-id-123',
                    raceId: 'race-id-123',
                },
            });
        });

        // should return BadRequestException if event is not published
        it('should return BadRequestException if event is not published', async () => {
            mockPrisma.race.findUnique.mockResolvedValue(
                mockRaceWithDraftEvent,
            );
            await expect(
                service.create('user-id-123', 'race-id-123'),
            ).rejects.toThrow(BadRequestException);
        });

        // should return BadRequestException if race is full
        it('should return BadRequestException if race is full', async () => {
            mockPrisma.race.findUnique.mockResolvedValue(mockRace);
            mockRaceService.checkCapacity.mockResolvedValue(
                mockCapacityUnavailable,
            );

            await expect(
                service.create('user-id-123', 'race-id-123'),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // cancel
    describe('cancel registration', () => {
        // should be able to cancel registration
        it('should be able to cancel registration', async () => {
            mockPrisma.registration.findUnique.mockResolvedValue(
                mockRegistration,
            );
            mockPrisma.registration.update.mockResolvedValue({
                ...mockRegistration,
                status: 'CANCELLED',
            });
            const result = await service.cancel('reg-id-123', 'user-id-123');
            expect(result).toEqual({
                ...mockRegistration,
                status: 'CANCELLED',
            });
        });

        // should return ForbiddenException if different user is cancelling
        it('should return ForbiddenException if different user is cancelling', async () => {
            mockPrisma.registration.findUnique.mockResolvedValue(
                mockRegistration,
            );
            await expect(
                service.cancel('reg-id-123', 'user-id-124'),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // confirm
    describe('confirm registration', () => {
        it('should be able to confirm registration', async () => {
            mockPrisma.registration.update.mockResolvedValue({
                ...mockRegistration,
                status: 'CONFIRMED',
            });
            const result = await service.confirm('reg-id-123');
            expect(result).toEqual({
                ...mockRegistration,
                status: 'CONFIRMED',
            });
        });
    });

    // listbyrace
    describe('list by race', () => {
        // return without cursor
        it('should return registrations without cursor', async () => {
            mockPrisma.registration.findMany.mockResolvedValue([
                mockRegistration,
            ]);
            const result = await service.listByRace('race-id-123');

            expect(result).toEqual({
                data: [mockRegistration],
                meta: {
                    cursor: 'reg-id-123',
                },
            });

            expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { raceId: 'race-id-123' },
                orderBy: { registeredAt: 'asc' },
            });
        });

        // test: returns registrations with cursor -> verify skip 1 and cursor
        it('should return registrations with cursor', async () => {
            mockPrisma.registration.findMany.mockResolvedValue([
                mockRegistration,
            ]);
            const result = await service.listByRace(
                'race-id-123',
                'reg-id-123',
            );

            expect(result).toEqual({
                data: [mockRegistration],
                meta: {
                    cursor: 'reg-id-123',
                },
            });
            expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { raceId: 'race-id-123' },
                orderBy: { registeredAt: 'asc' },
                skip: 1,
                cursor: { id: 'reg-id-123' },
            });
        });
    });

    // listbyuser
    describe('list by user', () => {
        // return without cursor
        it('should return registrations without cursor', async () => {
            mockPrisma.registration.findMany.mockResolvedValue([
                mockRegistration,
            ]);
            const result = await service.listByUser({
                userId: 'user-id-123',
            });

            expect(result).toEqual({
                data: [mockRegistration],
                meta: {
                    cursor: 'reg-id-123',
                },
            });

            expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { userId: 'user-id-123' },
                orderBy: { registeredAt: 'asc' },
            });
        });

        it('should return registrations without cursor as CONFIRMED', async () => {
            mockPrisma.registration.findMany.mockResolvedValue([
                { ...mockRegistration, status: 'CONFIRMED' },
            ]);
            const result = await service.listByUser({
                userId: 'user-id-123',
                status: 'CONFIRMED',
            });

            expect(result).toEqual({
                data: [{ ...mockRegistration, status: 'CONFIRMED' }],
                meta: {
                    cursor: 'reg-id-123',
                },
            });

            expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { userId: 'user-id-123', status: 'CONFIRMED' },
                orderBy: { registeredAt: 'asc' },
            });
        });

        it('should return registrations without cursor as PENDING', async () => {
            mockPrisma.registration.findMany.mockResolvedValue([
                { ...mockRegistration, status: 'PENDING' },
            ]);
            const result = await service.listByUser({
                userId: 'user-id-123',
                status: 'PENDING',
            });

            expect(result).toEqual({
                data: [{ ...mockRegistration, status: 'PENDING' }],
                meta: {
                    cursor: 'reg-id-123',
                },
            });

            expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { userId: 'user-id-123', status: 'PENDING' },
                orderBy: { registeredAt: 'asc' },
            });
        });

        it('should return registrations without cursor as CANCELLED', async () => {
            mockPrisma.registration.findMany.mockResolvedValue([
                { ...mockRegistration, status: 'CANCELLED' },
            ]);
            const result = await service.listByUser({
                userId: 'user-id-123',
                status: 'CANCELLED',
            });

            expect(result).toEqual({
                data: [{ ...mockRegistration, status: 'CANCELLED' }],
                meta: {
                    cursor: 'reg-id-123',
                },
            });

            expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { userId: 'user-id-123', status: 'CANCELLED' },
                orderBy: { registeredAt: 'asc' },
            });
        });

        // test: returns published events with cursor -> verify skip 1 and cursor
        it('should return registrations with cursor', async () => {
            mockPrisma.registration.findMany.mockResolvedValue([
                mockRegistration,
            ]);
            const result = await service.listByUser({
                userId: 'user-id-123',
                cursor: 'reg-id-123',
            });

            expect(result).toEqual({
                data: [mockRegistration],
                meta: {
                    cursor: 'reg-id-123',
                },
            });
            expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { userId: 'user-id-123' },
                orderBy: { registeredAt: 'asc' },
                skip: 1,
                cursor: { id: 'reg-id-123' },
            });
        });

        it('should return registrations with cursor for CONFIRMED', async () => {
            mockPrisma.registration.findMany.mockResolvedValue([
                { ...mockRegistration, status: 'CONFIRMED' },
            ]);
            const result = await service.listByUser({
                userId: 'user-id-123',
                cursor: 'reg-id-123',
                status: 'CONFIRMED',
            });

            expect(result).toEqual({
                data: [{ ...mockRegistration, status: 'CONFIRMED' }],
                meta: {
                    cursor: 'reg-id-123',
                },
            });
            expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { userId: 'user-id-123', status: 'CONFIRMED' },
                orderBy: { registeredAt: 'asc' },
                skip: 1,
                cursor: { id: 'reg-id-123' },
            });
        });

        it('should return registrations with cursor for PENDING', async () => {
            mockPrisma.registration.findMany.mockResolvedValue([
                { ...mockRegistration, status: 'PENDING' },
            ]);
            const result = await service.listByUser({
                userId: 'user-id-123',
                cursor: 'reg-id-123',
                status: 'PENDING',
            });

            expect(result).toEqual({
                data: [{ ...mockRegistration, status: 'PENDING' }],
                meta: {
                    cursor: 'reg-id-123',
                },
            });
            expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { userId: 'user-id-123', status: 'PENDING' },
                orderBy: { registeredAt: 'asc' },
                skip: 1,
                cursor: { id: 'reg-id-123' },
            });
        });

        it('should return registrations with cursor for CANCELLED', async () => {
            mockPrisma.registration.findMany.mockResolvedValue([
                { ...mockRegistration, status: 'CANCELLED' },
            ]);
            const result = await service.listByUser({
                userId: 'user-id-123',
                cursor: 'reg-id-123',
                status: 'CANCELLED',
            });

            expect(result).toEqual({
                data: [{ ...mockRegistration, status: 'CANCELLED' }],
                meta: {
                    cursor: 'reg-id-123',
                },
            });
            expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { userId: 'user-id-123', status: 'CANCELLED' },
                orderBy: { registeredAt: 'asc' },
                skip: 1,
                cursor: { id: 'reg-id-123' },
            });
        });
    });

    // findbyid
    describe('find by id', () => {
        it('should be able to find by id', async () => {
            mockPrisma.registration.findUnique.mockResolvedValue(
                mockRegistration,
            );
            const result = await service.findById('reg-id-123');
            expect(result).toEqual(mockRegistration);
            await expect(
                mockPrisma.registration.findUnique,
            ).toHaveBeenCalledWith({
                where: {
                    id: 'reg-id-123',
                },
            });
        });
    });
});
