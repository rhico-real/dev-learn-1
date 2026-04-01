import { Test, TestingModule } from "@nestjs/testing";
import { EventService } from "./event.service";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { GenerateSlugService } from "../../../common/generate-slug.service";

describe('EventService', () => {
    let service: EventService;

    let mockEventDraft = {
        id: 'id-123',
        orgId: 'some-org-id',
        name: 'Test Event',
        slug: 'test-event',
        description: 'Unit test event',
        location: 'some-location',
        bannerImage: 'some-banner',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-01'),
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    let mockEventPublished = {
        id: 'id-123',
        orgId: 'some-org-id',
        name: 'Test Event',
        slug: 'test-event',
        description: 'Unit test event',
        location: 'some-location',
        bannerImage: 'some-banner',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-01'),
        status: 'PUBLISHED',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    let mockEventClosed = {
        id: 'id-123',
        orgId: 'some-org-id',
        name: 'Test Event',
        slug: 'test-event',
        description: 'Unit test event',
        location: 'some-location',
        bannerImage: 'some-banner',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-01'),
        status: 'CLOSED',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    let mockEventCompleted = {
        id: 'id-123',
        orgId: 'some-org-id',
        name: 'Test Event',
        slug: 'test-event',
        description: 'Unit test event',
        location: 'some-location',
        bannerImage: 'some-banner',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-01'),
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    let mockPrisma = {
        event: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn()
        },
        registration: {
            count: jest.fn()
        }
    }

    let mockGenerateSlug = {
        generateSlug: jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: GenerateSlugService, useValue: mockGenerateSlug },
            ]
        }).compile();

        service = module.get<EventService>(EventService);
        jest.clearAllMocks();
    });

    /**
     * TESTS:
     * updateStatus
     *   should allow DRAFT -> PUBLISHED
     *   should throw BadRequest for DRAFT -> CLOSED (invalid transition)
     *   PUBLISHED -> CLOSED: allowed
     *   CLOSED -> COMPLETED: allowed
     *   COMPLETED -> anything: throws terminal state
     *   PUBLISHED -> DRAFT with 0 registrations: allowed
     *   PUBLISHED -> DRAFT with registration: throws
     * delete
     * create
     * findbyId
     * findbyslug
     * exists
     * listPublished
     */
    describe('updatestatus', () => {
        it('should allow DRAFT -> PUBLISHED', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(mockEventDraft);
            mockPrisma.event.update.mockResolvedValue(mockEventPublished);

            const result = await service.updateStatus('id-123', { status: 'PUBLISHED' });

            expect(result).toEqual(mockEventPublished);
            await expect(mockPrisma.event.update).toHaveBeenCalledWith({
                where: {
                    id: 'id-123'
                },
                data: {
                    status: 'PUBLISHED'
                }
            });
        });

        it('should throw BadRequest for DRAFT -> CLOSED (invalid transition)', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(mockEventDraft);
            await expect(service.updateStatus('id-123', { status: 'CLOSED' })).rejects.toThrow(BadRequestException);
        });

        it('should allow PUBLISHED -> CLOSED', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(mockEventPublished);
            mockPrisma.event.update.mockResolvedValue(mockEventClosed);

            const result = await service.updateStatus('id-123', { status: 'CLOSED' });
            expect(result).toEqual(mockEventClosed);
            await expect(mockPrisma.event.update).toHaveBeenCalledWith({
                where: {
                    id: 'id-123'
                },
                data: {
                    status: 'CLOSED'
                }
            })
        });

        it('should throw BadRequestException if transitioning from COMPLETED to anything', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(mockEventCompleted);

            await expect(service.updateStatus('id-123', { status: 'DRAFT' })).rejects.toThrow(BadRequestException);
            await expect(service.updateStatus('id-123', { status: 'PUBLISHED' })).rejects.toThrow(BadRequestException);
            await expect(service.updateStatus('id-123', { status: 'CLOSED' })).rejects.toThrow(BadRequestException);
        });

        it('should be allowed to update status if PUBLISHED -> DRAFT with 0 registrations', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(mockEventPublished);
            mockPrisma.registration.count.mockResolvedValue(0);
            mockPrisma.event.update.mockResolvedValue(mockEventDraft);

            const result = await service.updateStatus('id-123', { status: 'DRAFT' });
            expect(result).toBe(mockEventDraft);
            await expect(mockPrisma.event.update).toHaveBeenCalledWith({
                where: {
                    id: 'id-123'
                },
                data: {
                    status: 'DRAFT'
                }
            })
        });

        it('should throw BadRequestException if PUBLISHED -> DRAFT with registrations', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(mockEventPublished);
            mockPrisma.registration.count.mockResolvedValue(1);

            await expect(service.updateStatus('id-123', { status: 'DRAFT' })).rejects.toThrow(BadRequestException);
        });
    });

    describe('delete event', () => {
        it('should be able to delete only if event is DRAFT', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(mockEventDraft);
            mockPrisma.event.delete.mockResolvedValue(mockEventDraft);

            const result = await service.delete('id-123');
            expect(result).toBe(mockEventDraft);
            await expect(mockPrisma.event.delete).toHaveBeenCalledWith({
                where: {
                    id: 'id-123'
                }
            })
        });

        it('should return BadRequestException if deleting event status that is PUBLISHED', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(mockEventPublished);

            await expect(service.delete('id-123')).rejects.toThrow(BadRequestException);
        });

        it('should return BadRequestException if deleting event status that is CLOSED', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(mockEventClosed);

            await expect(service.delete('id-123')).rejects.toThrow(BadRequestException);
        });

        it('should return BadRequestException if deleting event status that is COMPLETED', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(mockEventCompleted);

            await expect(service.delete('id-123')).rejects.toThrow(BadRequestException);
        });
    });

    describe('create event', () => {
        it('should be able to create event', async () => {
            mockPrisma.event.create.mockResolvedValue(mockEventDraft);
            mockGenerateSlug.generateSlug.mockReturnValue('test-event');

            const result = await service.create('some-org-id', {
                name: 'Test Event',
                description: 'Unit test event',
                location: 'some-location',
                bannerImage: 'some-banner',
                startDate: '2026-06-01',
                endDate: '2026-06-02',
            });
            expect(result.slug).toEqual('test-event');
            expect(result).toBe(mockEventDraft);
            await expect(mockPrisma.event.create).toHaveBeenCalledWith({
                data: {
                    orgId: 'some-org-id',
                    slug: 'test-event',
                    name: 'Test Event',
                    description: 'Unit test event',
                    location: 'some-location',
                    bannerImage: 'some-banner',
                    startDate: '2026-06-01T00:00:00.000Z',
                    endDate: '2026-06-02T00:00:00.000Z',
                }
            })
        });
    });

    describe('find event by id', () => {
        it('should return event by id if found', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(mockEventDraft);
            const result = await service.findById('id-123');
            expect(result).toBe(mockEventDraft);
            expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 'id-123'
                }
            });
        });

        it('should return NotFoundException if event is not found', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(null);
            await expect(service.findById('id-123')).rejects.toThrow(NotFoundException);
        });
    });

    describe('find event by slug', () => {
        it('should return event by slug if found', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(mockEventDraft);
            const result = await service.findBySlug('test-event');
            expect(result).toBe(mockEventDraft);
            expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
                where: {
                    slug: 'test-event'
                }
            });
        });

        it('should return NotFoundException if event is not found', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(null);
            await expect(service.findById('id-123')).rejects.toThrow(NotFoundException);
        });
    });

    describe('event exists', () => {
        it('should return true if event exists', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(mockEventDraft);
            const result = await service.exists('id-123');
            expect(result).toEqual(true);

            expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 'id-123'
                }
            });
        });

        it('should return NotFoundExcetion if event is not found', async () => {
            mockPrisma.event.findUnique.mockResolvedValue(null);
            await expect(service.exists('id-123')).rejects.toThrow(NotFoundException);
        });
    });

    describe('list published', () => {
        // test: returns published events without cursor and
        //  verify: findMany called with status published and asc startdate order
        it('should return published events without cursor', async () => {
            mockPrisma.event.findMany.mockResolvedValue([mockEventPublished]);
            const result = await service.listPublished();

            expect(result).toEqual({
                data: [mockEventPublished],
                meta: {
                    cursor: 'id-123'
                }
            });
            expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { status: 'PUBLISHED' },
                orderBy: { startDate: 'asc' }
            });
        });


        // test: returns published events with cursor -> verify skip 1 and cursor
        it('shouls return published events with cursor', async () => {
            mockPrisma.event.findMany.mockResolvedValue([mockEventPublished]);
            const result = await service.listPublished('id-123');

            expect(result).toEqual({
                data: [mockEventPublished],
                meta: {
                    cursor: 'id-123'
                }
            });
            expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { status: 'PUBLISHED' },
                orderBy: { startDate: 'asc' },
                skip: 1,
                cursor: { id: 'id-123' }
            })
        });
    });

});