import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { GenerateSlugService } from '../../../common/generate-slug.service';

const VALID_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['PUBLISHED'],
    PUBLISHED: ['DRAFT', 'CLOSED'],
    CLOSED: ['COMPLETED'],
    COMPLETED: [],
};

// const eventStatusMap: Record<string, EventStatus> = {
//     DRAFT: EventStatus.DRAFT,
//     PUBLISHED: EventStatus.PUBLISHED,
//     CLOSED: EventStatus.CLOSED,
//     COMPLETED: EventStatus.COMPLETED,
// }

@Injectable()
export class EventService {
    constructor(
        private prisma: PrismaService,
        private generateSlug: GenerateSlugService,
    ) {}

    async findById(id: string) {
        const event = await this.prisma.event.findUnique({
            where: {
                id: id,
            },
        });

        if (!event) throw new NotFoundException('Event not found');

        return event;
    }

    async findBySlug(slug: string) {
        const event = await this.prisma.event.findUnique({
            where: {
                slug: slug,
            },
        });

        if (!event) throw new NotFoundException('Event not found');

        return event;
    }

    async exists(id: string) {
        const event = await this.prisma.event.findUnique({
            where: {
                id: id,
            },
        });

        if (!event) throw new NotFoundException('Event not found');

        return !!event;
    }

    async create(orgId: string, dto: CreateEventDto) {
        const slug = this.generateSlug.generateSlug(dto.name);

        return await this.prisma.event.create({
            data: {
                orgId,
                name: dto.name,
                slug,
                description: dto.description,
                location: dto.location,
                bannerImage: dto.bannerImage,
                startDate: new Date(dto.startDate).toISOString(),
                endDate: new Date(dto.endDate).toISOString(),
            },
        });
    }

    async update(id: string, dto: UpdateEventDto) {
        return await this.prisma.event.update({
            where: {
                id: id,
            },
            data: {
                name: dto.name,
                description: dto.description,
                location: dto.location,
                bannerImage: dto.bannerImage,
                startDate: dto.startDate,
                endDate: dto.endDate,
            },
        });
    }

    async updateStatus(id: string, dto: UpdateEventStatusDto) {
        // 1. Get the current event
        const event = await this.findById(id);

        if (!event) throw new NotFoundException('Event not found.');

        // 2. Check if this transition is allowed
        const validTransitions = VALID_TRANSITIONS[event.status.toUpperCase()];
        if (!validTransitions.includes(dto.status.toUpperCase())) {
            throw new BadRequestException(
                `Cannot transition from ${event.status} to ${dto.status}`,
            );
        }

        // 3. Special case: PUBLISHED → DRAFT only allowed if nobody registered yet
        if (event.status === 'PUBLISHED' && dto.status === 'DRAFT') {
            const registration = await this.prisma.registration.count({
                where: {
                    race: {
                        eventId: id,
                    },
                    status: 'CONFIRMED',
                },
            });

            if (registration > 0) {
                throw new BadRequestException(
                    'Cannot revert to DRAFT — event has confirmed registrations',
                );
            }
        }

        // 4. update the status
        return this.prisma.event.update({
            where: {
                id: id,
            },
            data: {
                status: dto.status,
            },
        });
    }

    async delete(id: string) {
        // can only be deleted if event is in draft status
        const event = await this.prisma.event.findUnique({
            where: { id },
        });

        if (event?.status !== 'DRAFT') {
            throw new BadRequestException('Only DRAFT events can be deleted');
        }

        return await this.prisma.event.delete({
            where: { id },
        });
    }

    async listPublished(cursor?: string, take: number = 20) {
        const args: Prisma.EventFindManyArgs = {
            take,
            where: { status: 'PUBLISHED' },
            orderBy: { startDate: 'asc' },
        };

        if (cursor) {
            args.skip = 1;
            args.cursor = { id: cursor };
        }

        const event = await this.prisma.event.findMany(args);
        const nextCursor = event.at(-1)?.id;

        return {
            data: event,
            meta: {
                cursor: nextCursor,
            },
        };
    }
}
