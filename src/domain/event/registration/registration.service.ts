import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RaceService } from '../race/race.service';
import { Prisma, RegistrationStatus } from '@prisma/client';

const registrationStatus: Record<string, RegistrationStatus> = {
    PENDING: RegistrationStatus.PENDING,
    CONFIRMED: RegistrationStatus.CONFIRMED,
    CANCELLED: RegistrationStatus.CANCELLED,
};
@Injectable()
export class RegistrationService {
    constructor(
        private prisma: PrismaService,
        private raceService: RaceService,
    ) {}
    /**
     * Registration
     * 1. Get race + parent event in one query
     * 2. If event is not published -> not open for registration
     * 3. Check if capacity is full
     * 4. If all checks out, create registration
     */

    async create(userId: string, raceId: string) {
        // Get race and parent event in one query
        const race = await this.prisma.race.findUnique({
            where: {
                id: raceId,
            },
            include: {
                event: true,
            },
        });

        // check event
        if (race?.event.status !== 'PUBLISHED') {
            throw new BadRequestException(
                'Event is not yet open for registration.',
            );
        }

        // check capacity if full
        const capacity = await this.raceService.checkCapacity(raceId);

        if (!capacity.available) {
            throw new BadRequestException('Race is at full capacity.');
        }

        // create registration
        try {
            return await this.prisma.registration.create({
                data: {
                    userId,
                    raceId,
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException(
                    'You are already registered for this race.',
                );
            }

            throw error;
        }
    }

    /**
     * Cancel (registrationId, userId)
     * 1. Only the person who registered can cancel
     * 2. Set status as CANCELLED
     */
    async cancel(registrationId: string, userId: string) {
        const registration = await this.prisma.registration.findUnique({
            where: {
                id: registrationId,
            },
        });

        if (!registration) {
            throw new NotFoundException('Registration not found.');
        }

        if (registration.userId !== userId) {
            throw new ForbiddenException(
                'You can only cancel your own registration',
            );
        }

        return await this.prisma.registration.update({
            where: {
                id: registrationId,
            },
            data: {
                status: 'CANCELLED',
            },
        });
    }

    /**
     * Confirm (registrationId)
     * 1. Set status as CONFIRMED
     */
    async confirm(registrationId: string) {
        try {
            return await this.prisma.registration.update({
                where: {
                    id: registrationId,
                },
                data: {
                    status: 'CONFIRMED',
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundException('Registration not found.');
            }

            throw error;
        }
    }

    /**
     * List by Race (raceId, cursor?, take?)
     */
    async listByRace(raceId: string, cursor?: string, take: number = 20) {
        const args: Prisma.RegistrationFindManyArgs = {
            take,
            where: {
                raceId: raceId,
            },
            orderBy: { registeredAt: 'asc' },
        };

        if (cursor) {
            args.skip = 1;
            args.cursor = { id: cursor };
        }

        const registration = await this.prisma.registration.findMany(args);
        const nextCursor = registration.at(-1)?.id;

        return {
            data: registration,
            meta: {
                cursor: nextCursor,
            },
        };
    }

    /**
     * List by User (userId, cursor?, take?)
     */
    async listByUser({
        userId,
        cursor,
        take = 20,
        status,
    }: {
        userId: string;
        cursor?: string;
        take?: number;
        status?: string;
    }) {
        if (!!status && !(status.toUpperCase() in registrationStatus)) {
            throw new BadRequestException('Invalid registration status.');
        }

        const args: Prisma.RegistrationFindManyArgs = {
            take,
            where: {
                userId: userId,
                ...(status && {
                    status: registrationStatus[status.toUpperCase()],
                }),
            },
            orderBy: { registeredAt: 'asc' },
        };

        if (cursor) {
            args.skip = 1;
            args.cursor = { id: cursor };
        }

        const registration = await this.prisma.registration.findMany(args);
        const nextCursor = registration.at(-1)?.id;

        return {
            data: registration,
            meta: {
                cursor: nextCursor,
            },
        };
    }

    /**
     * Find by Id (id)
     */
    async findById(id: string) {
        return this.prisma.registration.findUnique({
            where: {
                id,
            },
        });
    }
}
