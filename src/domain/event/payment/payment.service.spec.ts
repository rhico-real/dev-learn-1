import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
    PaymentMethod,
    PaymentStatus,
    RegistrationStatus,
} from '@prisma/client';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { ReviewAction } from './dto/review-payment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

describe('PaymentService', () => {
    let service: PaymentService;

    let mockPrisma = {
        payment: {
            count: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
        },
        registration: {
            findUnique: jest.fn(),
        },
    };

    let mockRace = {
        id: 'race-id-123',
        eventId: 'event-id-123',
        name: 'Test Race',
        distance: 123.45,
        unit: 'test-unit',
        maxParticipants: 50,
        price: 100,
    };

    let mockRegistration = {
        id: 'registration-id-123',
        userId: 'user-id-123',
        race: mockRace,
        raceId: 'race-id-123',
        status: RegistrationStatus.PENDING,
    };

    let mockPayment = {
        id: 'payment-id-123',
        registrationId: 'registration-id-123',
        method: PaymentMethod.GCASH,
        amount: 100,
        proofImage: 'https://example.com/image.jpg',
        status: PaymentStatus.SUBMITTED,
    };

    let mockEvent = {
        emit: jest.fn(),
    };

    let mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: EventEmitter2, useValue: mockEvent },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<PaymentService>(PaymentService);

        jest.resetAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-04-27T07:32:11.223Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('create', () => {
        it('should create a payment for own registration', async () => {
            mockPrisma.registration.findUnique.mockResolvedValue(
                mockRegistration,
            );
            mockPrisma.payment.count.mockResolvedValue(0);
            mockPrisma.payment.findFirst.mockResolvedValue(null);
            mockPrisma.payment.create.mockResolvedValue(mockPayment);

            const result = await service.create(
                'user-id-123',
                'registration-id-123',
                {
                    method: PaymentMethod.GCASH,
                    amount: 100,
                    currency: 'PHP',
                    proofImage: 'https://example.com/image.jpg',
                },
            );

            expect(result).toEqual(mockPayment);
        });

        it('should throw ForbiddenException for someone elses registration', async () => {
            mockPrisma.registration.findUnique.mockResolvedValue(
                mockRegistration,
            );

            await expect(
                service.create('user-id-124', 'registration-id-123', {
                    method: PaymentMethod.GCASH,
                    amount: 100,
                    currency: 'PHP',
                    proofImage: 'https://example.com/image.jpg',
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException if registration is not PENDING', async () => {
            mockPrisma.registration.findUnique.mockResolvedValue({
                ...mockRegistration,
                status: RegistrationStatus.CONFIRMED,
            });

            await expect(
                service.create('user-id-123', 'registration-id-123', {
                    method: PaymentMethod.GCASH,
                    amount: 100,
                    currency: 'PHP',
                    proofImage: 'https://example.com/image.jpg',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if amount does not match race price', async () => {
            mockPrisma.registration.findUnique.mockResolvedValue(
                mockRegistration,
            );
            mockPrisma.payment.count.mockResolvedValue(0);
            mockPrisma.payment.findFirst.mockResolvedValue(null);

            await expect(
                service.create('user-id-123', 'registration-id-123', {
                    method: PaymentMethod.GCASH,
                    amount: 20,
                    currency: 'PHP',
                    proofImage: 'https://example.com/image.jpg',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw ConflictException if an active payment exists', async () => {
            mockPrisma.registration.findUnique.mockResolvedValue(
                mockRegistration,
            );
            mockPrisma.payment.count.mockResolvedValue(0);
            mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);

            await expect(
                service.create('user-id-123', 'registration-id-123', {
                    method: PaymentMethod.GCASH,
                    amount: 20,
                    currency: 'PHP',
                    proofImage: 'https://example.com/image.jpg',
                }),
            ).rejects.toThrow(ConflictException);
        });

        it('should throw BadRequestException if 3 rejected payments already exist', async () => {
            mockPrisma.registration.findUnique.mockResolvedValue(
                mockRegistration,
            );
            mockPrisma.payment.count.mockResolvedValue(3);

            await expect(
                service.create('user-id-123', 'registration-id-123', {
                    method: PaymentMethod.GCASH,
                    amount: 20,
                    currency: 'PHP',
                    proofImage: 'https://example.com/image.jpg',
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('review', () => {
        let reviewerId = 'reviewer-id-123';

        it('should approve a submitted payment', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                registration: mockRegistration,
            });
            mockPrisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.APPROVED,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
            });

            const result = await service.review(reviewerId, 'payment-id-123', {
                action: ReviewAction.APPROVE,
            });

            expect(result).toEqual({
                ...mockPayment,
                status: PaymentStatus.APPROVED,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
            });
        });

        it('should reject a submitted payment with reason', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                registration: mockRegistration,
            });
            mockPrisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.REJECTED,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
                rejectionReason: 'Test reason',
            });
            mockPrisma.payment.count.mockResolvedValue(0);

            const result = await service.review(reviewerId, 'payment-id-123', {
                action: ReviewAction.REJECT,
                rejectionReason: 'Test reason',
            });

            expect(result).toEqual({
                ...mockPayment,
                status: PaymentStatus.REJECTED,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
                rejectionReason: 'Test reason',
            });
        });

        it('should throw BadRequestException when rejecting without reason', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

            await expect(
                service.review(reviewerId, 'payment-id-123', {
                    action: ReviewAction.REJECT,
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException for already reviewed payment', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.REJECTED,
            });

            await expect(
                service.review(reviewerId, 'payment-id-123', {
                    action: ReviewAction.REJECT,
                    rejectionReason: 'Test reason',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should emit payment.approved event on approval', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                registration: mockRegistration,
            });
            mockPrisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.APPROVED,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
            });

            const result = await service.review(reviewerId, 'payment-id-123', {
                action: ReviewAction.APPROVE,
            });

            expect(mockEvent.emit).toHaveBeenCalledWith('payment.approved', {
                paymentId: 'payment-id-123',
                registrationId: 'registration-id-123',
            });
        });

        it('should emit payment.rejected event with attempt count on rejection', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue({
                ...mockPayment,
                registration: mockRegistration,
            });
            mockPrisma.payment.update.mockResolvedValue({
                ...mockPayment,
                status: PaymentStatus.REJECTED,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
                rejectionReason: 'Test reason',
            });
            mockPrisma.payment.count.mockResolvedValue(1);

            const result = await service.review(reviewerId, 'payment-id-123', {
                action: ReviewAction.REJECT,
                rejectionReason: 'Test reason',
            });

            expect(mockEvent.emit).toHaveBeenCalledWith('payment.rejected', {
                paymentId: 'payment-id-123',
                registrationId: 'registration-id-123',
                rejectionCount: 1,
            });
        });
    });

    describe('findById', () => {
        it('should return a payment by id', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
            const result = await service.findById('payment-id-123');
            expect(result).toEqual(mockPayment);
        });

        it('should throw NotFoundException if payment does not exist', async () => {
            mockPrisma.payment.findUnique.mockResolvedValue(null);
            await expect(service.findById('payment-id-123')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('listByRegistration', () => {
        it('should return payments for a registration with cursor pagination', async () => {
            mockPrisma.payment.findMany.mockResolvedValue([mockPayment]);
            const result =
                await service.listByRegistration('registation-id-123');
            expect(result).toEqual({
                data: [mockPayment],
                meta: {
                    cursor: 'payment-id-123',
                },
            });
        });
    });

    describe('listByEvent', () => {
        it('should return payments for all registrations in an event', async () => {
            mockPrisma.payment.findMany.mockResolvedValue([mockPayment]);
            const result = await service.listByEvent('event-id-123');
            expect(result).toEqual({
                data: [mockPayment],
                meta: {
                    cursor: 'payment-id-123',
                },
            });
        });
        it('should filter by status when provided', async () => {
            mockPrisma.payment.findMany.mockResolvedValue([mockPayment]);
            const result = await service.listByEvent(
                'event-id-123',
                PaymentStatus.SUBMITTED,
            );
            expect(result).toEqual({
                data: [mockPayment],
                meta: {
                    cursor: 'payment-id-123',
                },
            });
        });
    });
});
