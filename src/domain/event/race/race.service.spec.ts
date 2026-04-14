import { Test, TestingModule } from '@nestjs/testing';
import { RaceService } from './race.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { EventService } from '../event/event.service';
import { BadRequestException } from '@nestjs/common';

describe('RaceService', () => {
    let service: RaceService;

    const mockRace = {
        id: 'race-id-123',
        eventId: 'some-event-id',
        name: 'Test Race',
        distance: 123.45,
        unit: 'some-unit',
        maxParticipants: 500,
        price: 1000,
    };

    const mockUpdatedRace = {
        id: 'race-id-123',
        eventId: 'some-event-id',
        name: 'Updated Test Race',
        distance: 123.45,
        unit: 'some-unit',
        maxParticipants: 500,
        price: 1000,
    };

    const mockEventDraft = {
        id: 'some-event-id',
        orgId: 'some-org-id',
        name: 'Test Event',
        slug: 'test-event',
        status: 'DRAFT',
    };

    const mockEventPublished = {
        id: 'event-id-123',
        orgId: 'some-org-id',
        name: 'Test Event',
        slug: 'test-event',
        status: 'PUBLISHED',
    };

    const mockPrisma = {
        race: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        registration: {
            count: jest.fn(),
        },
    };

    const mockEventService = {
        findById: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RaceService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: EventService, useValue: mockEventService },
            ],
        }).compile();

        service = module.get<RaceService>(RaceService);
        jest.clearAllMocks();
    });

    // list by event
    describe('list by event', () => {
        it('should list by event', async () => {
            mockPrisma.race.findMany.mockResolvedValue([mockRace]);
            const result = await service.listByEvent('some-event-id');

            expect(result).toEqual([mockRace]);
        });
    });

    // check by capacity
    describe('check by capacity', () => {
        // Test: returns {available: true, remaining: 495} when 5 out of 500 confirmed
        it('should return {available: true, remaining: 495} when 5 out of 500 confirmed', async () => {
            mockPrisma.race.findUnique.mockResolvedValue(mockRace);
            mockPrisma.registration.count.mockResolvedValue(5);

            const result = await service.checkCapacity('id-123');

            expect(result.available).toBe(true);
            expect(result.remaining).toBe(495);
        });

        // Test: returns {available: false, remaining: 0} when  at capacity
        it('should returns {available: false, remaining: 0} when  at capacity', async () => {
            mockPrisma.race.findUnique.mockResolvedValue(mockRace);
            mockPrisma.registration.count.mockResolvedValue(500);

            const result = await service.checkCapacity('id-123');

            expect(result.available).toBe(false);
            expect(result.remaining).toBe(0);
        });
    });

    // create
    describe('create race', () => {
        // Test: should create race when event is DRAFT
        it('should create race when event is DRAFT', async () => {
            mockEventService.findById.mockResolvedValue(mockEventDraft);
            mockPrisma.race.create.mockResolvedValue(mockRace);

            const result = await service.create('some-event-id', {
                name: 'Test Race',
                distance: 123.45,
                unit: 'some-unit',
                maxParticipants: 500,
                price: 1000,
            });

            expect(result).toEqual(mockRace);
            expect(mockPrisma.race.create).toHaveBeenCalledWith({
                data: {
                    eventId: 'some-event-id',
                    name: 'Test Race',
                    distance: 123.45,
                    unit: 'some-unit',
                    maxParticipants: 500,
                    price: 1000,
                },
            });
        });

        // Test: should throw BadRequestException when event is not DRAFT
        it('should throw BadRequestException when event is not DRAFT', async () => {
            mockEventService.findById.mockResolvedValue(mockEventPublished);

            await expect(
                service.create('some-event-id', {
                    name: 'Test Race',
                    distance: 123.45,
                    unit: 'some-unit',
                    maxParticipants: 500,
                    price: 1000,
                }),
            ).rejects.toThrow(BadRequestException);
            expect(mockPrisma.race.create).not.toHaveBeenCalled();
        });
    });

    // update
    describe('update', () => {
        // Test: should update race if event is DRAFT
        it('should update race if event is DRAFT', async () => {
            mockPrisma.race.findUnique.mockResolvedValue(mockRace);
            mockEventService.findById.mockResolvedValue(mockEventDraft);
            mockPrisma.race.update.mockResolvedValue(mockUpdatedRace);

            const result = await service.update('race-id-123', {
                name: 'Updated Test Race',
            });

            expect(result).toEqual(mockUpdatedRace);
            expect(mockPrisma.race.update).toHaveBeenCalledWith({
                where: {
                    id: 'race-id-123',
                },
                data: {
                    name: 'Updated Test Race',
                },
            });
        });

        // Test: should throw BadRequestException when event is not DRAFT
        it('should throw BadRequestException when event is not DRAFT', async () => {
            mockPrisma.race.findUnique.mockResolvedValue(mockRace);
            mockEventService.findById.mockResolvedValue(mockEventPublished);

            await expect(
                service.update('race-id-123', { name: 'Updated Test Race' }),
            ).rejects.toThrow(BadRequestException);
            expect(mockPrisma.race.update).not.toHaveBeenCalled();
        });
    });

    // delete
    describe('delete', () => {
        // Test: should delete race when event is DRAFT
        it('should delete race when event is DRAFT', async () => {
            mockPrisma.race.findUnique.mockResolvedValue(mockRace);
            mockEventService.findById.mockResolvedValue(mockEventDraft);
            mockPrisma.race.delete.mockResolvedValue(mockRace);

            const result = await service.delete('race-id-123');

            expect(result).toEqual(mockRace);
            expect(mockPrisma.race.delete).toHaveBeenCalledWith({
                where: {
                    id: 'race-id-123',
                },
            });
        });

        // Test: should throw BadRequestException when event is not DRAFT
        it('should throw BadRequestException when event is not DRAFT', async () => {
            mockPrisma.race.findUnique.mockResolvedValue(mockRace);
            mockEventService.findById.mockResolvedValue(mockEventPublished);

            await expect(service.delete('race-id-123')).rejects.toThrow(
                BadRequestException,
            );
            expect(mockPrisma.race.delete).not.toHaveBeenCalled();
        });
    });

    describe('list by event', () => {
        it('should list by event', async () => {
            mockPrisma.race.findMany.mockResolvedValue([mockRace]);
            const result = await service.listByEvent('some-event-id');
            expect(result).toEqual([mockRace]);
        });
    });
});
