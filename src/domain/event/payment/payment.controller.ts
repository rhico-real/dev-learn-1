import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ForbiddenException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import * as interfaces from '../../../shared/types/interfaces';
import { PaginationQueryDTO } from '../../../shared/dto/pagination-query.dto';
import { RegistrationService } from '../registration/registration.service';
import { OrgMembershipService } from '../../organization/org-membership/org-membership.service';
import { RaceService } from '../race/race.service';
import { EventService } from '../event/event.service';
import { ReviewPaymentDto } from './dto/review-payment.dto';

@Controller()
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly registrationService: RegistrationService,
        private readonly raceService: RaceService,
        private readonly orgMembershipService: OrgMembershipService,
        private readonly eventService: EventService,
    ) {}

    @Post('/registrations/:id/payments')
    async create(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') registrationId: string,
        @Body() dto: CreatePaymentDto,
    ) {
        return this.paymentService.create(user.userId, registrationId, dto);
    }

    @Get('/registrations/:id/payments')
    async listByRegistration(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') registrationId: string,
        @Query() dto?: PaginationQueryDTO,
    ) {
        const registration =
            await this.registrationService.findById(registrationId);

        // ForbiddenException: You can only view payments for your own registration
        if (registration?.userId !== user.userId && user.role !== 'SUPER_ADMIN')
            throw new ForbiddenException(
                'You can only view payments for your own registration',
            );

        return this.paymentService.listByRegistration(
            registrationId,
            dto?.cursor,
            dto?.limit,
        );
    }

    @Get('/payments/:id')
    async findOne(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') paymentId: string,
    ) {
        const payment = await this.paymentService.findById(paymentId);
        const registration = await this.registrationService.findById(
            payment.registrationId,
        );

        // if not your registration and you're not SUPER_ADMIN
        if (
            registration &&
            registration?.userId !== user.userId &&
            user.role !== 'SUPER_ADMIN'
        ) {
            const race = await this.raceService.findRaceByEvent(
                registration?.raceId,
            );
            await this.orgMembershipService.verifyRole(
                user.userId,
                race!.event.orgId,
                'ADMIN',
            );
        }

        return payment;
    }

    @Get('/events/:eventId/payments')
    async listByEvent(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('eventId') eventId: string,
        @Query('status') status?: string,
        @Query() dto?: PaginationQueryDTO,
    ) {
        if (user.role !== 'SUPER_ADMIN') {
            const event = await this.eventService.findById(eventId);
            await this.orgMembershipService.verifyRole(
                user.userId,
                event.orgId,
                'ADMIN',
            );
        }

        return this.paymentService.listByEvent(
            eventId,
            status,
            dto?.cursor,
            dto?.limit,
        );
    }

    @Patch('/payments/:id/review')
    async review(
        @CurrentUser() reviewer: interfaces.AuthenticatedUser,
        @Param('id') paymentId: string,
        @Body() dto: ReviewPaymentDto,
    ) {
        // if not super admin -> verify role
        if (reviewer.role !== 'SUPER_ADMIN') {
            const payment = await this.paymentService.findById(paymentId);
            const registration = await this.registrationService.findById(
                payment.registrationId,
            );
            const race = await this.raceService.findRaceByEvent(
                registration!.raceId,
            );

            await this.orgMembershipService.verifyRole(
                reviewer.userId,
                race!.event.orgId,
                'ADMIN',
            );
        }

        return this.paymentService.review(reviewer.userId, paymentId, dto);
    }
}
