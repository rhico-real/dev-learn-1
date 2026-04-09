import {
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import * as interfaces from '../../../shared/types/interfaces';
import { RegistrationService } from './registration.service';
import { RaceService } from '../race/race.service';
import { OrgMembershipService } from '../../organization/org-membership/org-membership.service';

@Controller()
export class RegistrationController {
    constructor(
        private registrationService: RegistrationService,
        private raceService: RaceService,
        private orgMembershipService: OrgMembershipService,
    ) {}
    // POST /races/:raceId/registrations
    // No @Body() parameter — the body is empty.
    // raceId comes from the URL, userId comes from the JWT.
    @Post('/races/:raceId/registrations')
    async create(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('raceId') raceId: string,
    ) {
        return this.registrationService.create(user.userId, raceId);
    }

    // GET /races/:raceId/registrations — org admin sees all registrations
    // Look up the race + parent event in one query to find which org it belongs to
    @Get('/races/:raceId/registrations')
    async listByRace(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('raceId') raceId: string,
        @Query('cursor') cursor: string,
        @Query('limit') limit: number,
    ) {
        // get org
        const race = await this.raceService.findRaceByEvent(raceId);
        const orgId = race!.event.orgId;

        // check org membership, minimum ADMIN
        await this.orgMembershipService.verifyRole(user.userId, orgId, 'ADMIN');

        // return listByRace (cursor and take)
        return this.registrationService.listByRace(raceId, cursor, limit);
    }

    // GET /users/me/registrations — user sees their own registrations
    @Get('/users/me/registrations')
    async listByUser(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Query('cursor') cursor: string,
        @Query('limit') limit: number,
        @Query('status') status: string,
    ) {
        return this.registrationService.listByUser({
            userId: user.userId,
            cursor: cursor,
            take: limit,
            status: status,
        });
    }

    // PATCH /registrations/:id/confirm — admin confirms a registration
    // Look up registration → race → event → org to verify the user is an admin
    @Patch('/registrations/:id/confirm')
    async confirm(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') id: string,
    ) {
        // get registration
        const registration = await this.registrationService.findById(id);

        // get race -> event
        const race = await this.raceService.findRaceByEvent(
            registration!.raceId,
        );

        // get org
        const orgId = race!.event.orgId;

        // check if ADMIN
        await this.orgMembershipService.verifyRole(user.userId, orgId, 'ADMIN');

        // confirm registration
        return this.registrationService.confirm(id);
    }

    // DELETE /registrations/:id — cancel own registration
    @Delete('/registrations/:id')
    async cancel(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') id: string,
    ) {
        return this.registrationService.cancel(id, user.userId);
    }
}
