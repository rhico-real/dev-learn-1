import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RaceService } from '../race/race.service';
import { Prisma } from '@prisma/client';

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
      throw new BadRequestException('Event is not yet open for registration.');
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
    const registration = this.prisma.registration.findUnique({
      where: {
        id: registrationId,
      },
    });

    if (registration!.userId !== userId) {
    }
  }

  /**
   * Confirm (registrationId)
   * 1. Set status as CONFIRMED
   */

  /**
   * List by Race (raceId, cursor?, take?)
   */

  /**
   * List by User (userId, cursor?, take?)
   */

  /**
   * Find by Id (id)
   */

  /**
   * Find Race with Event (raceId)
   * 1. fetches a race with its parent event included
   */
}
