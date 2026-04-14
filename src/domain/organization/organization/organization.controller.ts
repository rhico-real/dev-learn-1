import {
    Body,
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
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationService } from './organization.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrgMembershipService } from '../org-membership/org-membership.service';
import { PaginationQueryDTO } from '../../../shared/dto/pagination-query.dto';

@Controller('organizations')
export class OrganizationController {
    constructor(
        private orgService: OrganizationService,
        private membershipService: OrgMembershipService,
    ) {}

    // create
    @Post()
    create(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Body() dto: CreateOrganizationDto,
    ) {
        return this.orgService.create(user.userId, dto);
    }

    // list
    @Get()
    list(@Query() dto: PaginationQueryDTO) {
        return this.orgService.list(dto.cursor, dto.limit);
    }

    // find by slug
    @Get(':slug')
    findBySlug(@Param('slug') slug: string) {
        return this.orgService.findBySlug(slug);
    }

    // update
    @Patch(':id')
    async update(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') id: string,
        @Body() dto: UpdateOrganizationDto,
    ) {
        // Permission check: Only ADMIN can update
        await this.membershipService.verifyRole(user.userId, id, 'ADMIN');
        return this.orgService.update(id, dto);
    }

    // delete
    @Delete(':id')
    async delete(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') id: string,
    ) {
        // Permission check: Only OWNER can delete
        await this.membershipService.verifyRole(user.userId, id, 'OWNER');
        return this.orgService.delete(id);
    }
}
