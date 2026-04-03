import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CurrentUser } from "../../../shared/decorators/current-user.decorator";
import * as interfaces from "../../../shared/types/interfaces";
import { CreateRaceDto } from "./dto/create-race.dto";
import { RaceService } from "./race.service";
import { EventService } from "../event/event.service";
import { OrgMembershipService } from "../../organization/org-membership/org-membership.service";
import { UpdateRaceDto } from "./dto/update-race.dto";

// Route: events/:eventId/races
@Controller()
export class RaceController{
    constructor(private raceService: RaceService, private eventService: EventService, private orgMembershipService: OrgMembershipService){}

    // POST: /events/:eventId/races -> verify ADMIN role then create
    @Post('/events/:eventId/races')
    async create(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('eventId') eventId: string,
        @Body() dto: CreateRaceDto
    ){
        const event = await this.eventService.findById(eventId);
        await this.orgMembershipService.verifyRole(user.userId, event.orgId, 'ADMIN');
        return this.raceService.create(eventId, dto);
    }

    // GET: /events/:eventId/races -> list races for event
    @Get('/events/:eventId/races')
    async listRaces(
        @Param('eventId') eventId: string
    ){
        return this.raceService.listByEvent(eventId);
    }

    // PATCH: /races/:id -> verify ADMIN role then update
    @Patch('/races/:id')
    async updateRace(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') raceId: string,
        @Body() dto: UpdateRaceDto
    ){
        const race = await this.raceService.findById(raceId);
        const event = await this.eventService.findById(race!.eventId);

        await this.orgMembershipService.verifyRole(user.userId, event.orgId, 'ADMIN');

        return this.raceService.update(raceId, dto);
    }

    // DELETE: /races/:id -> verify ADMIN role then delete
    @Delete('/races/:id')
    async deleteRace(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') raceId: string
    ){
        const race = await this.raceService.findById(raceId);
        const event = await this.eventService.findById(race!.eventId);

        await this.orgMembershipService.verifyRole(user.userId, event.orgId, 'ADMIN');

        return this.raceService.delete(raceId);
    }
}