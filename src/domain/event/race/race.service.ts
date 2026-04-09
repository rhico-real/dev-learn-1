import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CreateRaceDto } from './dto/create-race.dto';
import { UpdateRaceDto } from './dto/update-race.dto';
import { EventService } from '../event/event.service';

@Injectable()
export class RaceService {
  constructor(
    private prismaService: PrismaService,
    private eventService: EventService,
  ) {}

  // verify event is draft
  /**
   * find event by id
   * id event is not draft, throw bad request -> Races can only be modified when the event is in draft status
   * else, return the event
   */
  private async verifyEventIsDraft(eventId: string) {
    const event = await this.eventService.findById(eventId);

    if (event?.status !== 'DRAFT') {
      throw new BadRequestException(
        'Races can only be modified when the event is in draft status.',
      );
    }

    return event;
  }

  async findById(id: string) {
    const result = await this.prismaService.race.findUnique({
      where: { id },
    });

    if (!result) throw new NotFoundException('Race not found');

    return result;
  }

  async findRaceByEvent(id: string) {
    return await this.prismaService.race.findUnique({
      where: { id },
      include: { event: true },
    });
  }

  async listByEvent(eventId: string) {
    return this.prismaService.race.findMany({
      where: {
        eventId: eventId,
      },
    });
  }

  async checkCapacity(raceId: string) {
    const race = await this.findById(raceId);

    // check all confirmed registrations of the race
    const confimedCount = await this.prismaService.registration.count({
      where: {
        raceId: raceId,
        status: 'CONFIRMED',
      },
    });

    // check remaining
    const remaining = race!.maxParticipants - confimedCount;

    // return: available->boolean, remaining->count
    return {
      available: remaining > 0,
      remaining: Math.max(0, remaining),
    };
  }

  // create (event must be draft)
  async create(eventId: string, dto: CreateRaceDto) {
    await this.verifyEventIsDraft(eventId);

    return this.prismaService.race.create({
      data: {
        ...dto,
        eventId,
      },
    });
  }

  // update (event must be draft)
  async update(id: string, dto: UpdateRaceDto) {
    const race = await this.findById(id);
    await this.verifyEventIsDraft(race!.eventId);

    return this.prismaService.race.update({
      where: {
        id,
      },
      data: {
        ...dto,
      },
    });
  }

  // delete (event must be draft)
  async delete(id: string) {
    const race = await this.findById(id);
    await this.verifyEventIsDraft(race!.eventId);

    return this.prismaService.race.delete({
      where: {
        id,
      },
    });
  }
}
