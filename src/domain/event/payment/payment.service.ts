import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PaymentStatus, Prisma } from '@prisma/client';
import { ReviewAction, ReviewPaymentDto } from './dto/review-payment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEventTypes } from '../../../common/notification-events';

const MAX_PAYMENT_ATTEMPTS = 3;

@Injectable()
export class PaymentService {
    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2,
    ) {}

    async create(
        userId: string,
        registrationId: string,
        dto: CreatePaymentDto,
    ) {
        // find registration
        const registration = await this.prisma.registration.findUnique({
            where: {
                id: registrationId,
            },
            include: {
                race: true,
            },
        });

        // NotFoundException Registration not found
        if (!registration)
            throw new NotFoundException('Registration not found');

        // ForbiddenException: You can only submit payment for your own registration
        if (registration.userId !== userId)
            throw new ForbiddenException(
                'You can only submit payment for your own registration',
            );

        // BadRequestException: Payment can only be submitted for pending registration
        if (registration.status !== 'PENDING')
            throw new BadRequestException(
                'Payment can only be submitted for pending registration',
            );

        // count rejected payments
        const rejectedCount = await this.prisma.payment.count({
            where: {
                status: PaymentStatus.REJECTED,
            },
        });

        // if rejected >= max payment attempts: Bad Request: Maximum payment attempts reached
        if (rejectedCount >= MAX_PAYMENT_ATTEMPTS)
            throw new BadRequestException('Maximum payment attempts reached');

        // check payment via registrationId for active Payment (submitted or under-review)
        const activePayment = await this.prisma.payment.findFirst({
            where: {
                registrationId,
                status: {
                    in: [PaymentStatus.SUBMITTED, PaymentStatus.UNDER_REVIEW],
                },
            },
        });

        // ConflictException: A payment is already pending review for this registration
        if (activePayment)
            throw new ConflictException(
                'A payment is already pending review for this registration',
            );

        // Bad Request: Payment amount does not match race price. Expected 100, got 25
        if (dto.amount != registration.race.price)
            throw new BadRequestException(
                `Payment amount does not match race price. Expected ${registration.race.price}, received ${dto.amount}`,
            );

        // create payment
        return this.prisma.payment.create({
            data: {
                registrationId: registrationId,
                method: dto.method,
                amount: dto.amount,
                currency: dto.currency,
                proofImage: dto.proofImage,
            },
        });
    }

    async review(reviewerId: string, paymentId: string, dto: ReviewPaymentDto) {
        // find payment
        const payment = await this.prisma.payment.findUnique({
            where: {
                id: paymentId,
            },
            include: {
                registration: true,
            },
        });

        // NotFoundException payment not found
        if (!payment) throw new NotFoundException('Payment not found');

        // BadRequestException only submitted payments can be reviewed
        if (payment.status !== 'SUBMITTED' && payment.status !== 'UNDER_REVIEW')
            throw new BadRequestException(
                'Only submitted payments can be reviewed',
            );

        // BadRequestException Rejection reason is required
        if (dto.action === ReviewAction.REJECT && !dto.rejectionReason)
            throw new BadRequestException('Rejection reason is required');

        // review action: approve -> update status to approve and eventemitter payment.approved
        if (dto.action === ReviewAction.APPROVE) {
            const update = await this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: PaymentStatus.APPROVED,
                    reviewedBy: reviewerId,
                    reviewedAt: new Date(),
                },
            });

            this.eventEmitter.emit(NotificationEventTypes.PAYMENT_APPROVED, {
                paymentId: payment.id,
                registrationId: payment.registration.id,
            });

            return update;
        }

        const reject = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.REJECTED,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
                rejectionReason: dto.rejectionReason,
            },
        });

        // review action: rejected -> update status to rejected and eventemitter payment.rejected with rejection count
        const rejectionCount = await this.prisma.payment.count({
            where: {
                registrationId: payment.registration.id,
                status: PaymentStatus.REJECTED,
            },
        });

        this.eventEmitter.emit(NotificationEventTypes.PAYMENT_REJECTED, {
            paymentId: payment.id,
            registrationId: payment.registration.id,
            rejectionCount: rejectionCount,
        });

        return reject;
    }

    async findById(paymentId: string) {
        const payment = await this.prisma.payment.findUnique({
            where: {
                id: paymentId,
            },
        });

        if (!payment) throw new NotFoundException('Payment not found');

        return payment;
    }

    async listByRegistration(
        registrationId: string,
        cursor?: string,
        take: number = 20,
    ) {
        const args: Prisma.PaymentFindManyArgs = {
            take,
            where: { registrationId: registrationId },
            orderBy: { updatedAt: 'desc' },
        };

        if (cursor) {
            args.skip = 1;
            args.cursor = { id: cursor };
        }

        const payments = await this.prisma.payment.findMany(args);
        const nextCursor = payments.at(-1)?.id;

        return {
            data: payments,
            meta: {
                cursor: nextCursor,
            },
        };
    }

    async listByEvent(
        eventId: string,
        status?: string,
        cursor?: string,
        take: number = 20,
    ) {
        const where: Prisma.PaymentWhereInput = {
            registration: {
                race: {
                    eventId: eventId,
                },
            },
        };

        if (status) {
            where.status = status as any;
        }

        const args: Prisma.PaymentFindManyArgs = {
            take,
            where: where,
            orderBy: { updatedAt: 'desc' },
        };

        if (cursor) {
            args.skip = 1;
            args.cursor = { id: cursor };
        }

        const payments = await this.prisma.payment.findMany(args);
        const nextCursor = payments.at(-1)?.id;

        return {
            data: payments,
            meta: {
                cursor: nextCursor,
            },
        };
    }
}
