import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../../../shared/decorators/current-user.decorator";
import * as interfaces from "../../../shared/types/interfaces";
import { OrgMembership } from "@prisma/client";
import { OrgMembershipService } from "../../organization/org-membership/org-membership.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { EventService } from "./event.service";
import { UpdateEventDto } from "./dto/update-event.dto";
import { UpdateEventStatusDto } from "./dto/update-event-status.dto";

@Controller('events')
export class EventController {
    constructor(private service: EventService, private membershipService: OrgMembershipService) { }

    // POST /events
    /**
     * Verify via ADMIN role
     * Then create event
     */
    @Post(':orgId')
    async create(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('orgId') orgId: string,
        @Body() dto: CreateEventDto
    ) {
        await this.membershipService.verifyRole(user.userId, orgId, 'ADMIN');
        return this.service.create(orgId, dto);
    }

    // GET  /events 
    @Get()
    async listPublished(
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: number,
    ) {
        return this.service.listPublished(cursor, limit);
    }

    // GET  /events/:slug
    @Get(':slug')
    async findBySlug(
        @Param('slug') slug: string,
    ) {
        return this.service.findBySlug(slug);
    }

    // PATCH /events/:id
    /**
     * Verify Admin role
     */
    @Patch(':id')
    async updateEvent(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') id: string,
        @Body() dto: UpdateEventDto
    ) {
        // Get the event
        const event = await this.service.findById(id);

        // Get the org of the event
        const orgId = event!.orgId;

        // check role of current user
        await this.membershipService.verifyRole(user.userId, orgId, 'ADMIN');

        return this.service.update(id, dto);
    }

    // PATCH /events/:id/status
    /**
     * Verify Admin role
     */
    @Patch(':id/status')
    async updateEventStatus(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') id: string,
        @Body() dto: UpdateEventStatusDto
    ) {
        // Get the event
        const event = await this.service.findById(id);

        // Get the org of the event
        const orgId = event!.orgId;

        // check role of current user
        await this.membershipService.verifyRole(user.userId, orgId, 'ADMIN');

        return this.service.updateStatus(id, dto);
    }

    // DELETE /events/:id
    /**
     * Verify Admin role
     * Can only be deleted if in DRAFT status
     */
    @Delete(':id')
    async delete(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') id: string,
    ) {
        // Get the event
        const event = await this.service.findById(id);

        // Get the org of the event
        const orgId = event!.orgId;

        // check role of current user
        await this.membershipService.verifyRole(user.userId, orgId, 'ADMIN');

        return this.service.delete(id);
    }
}