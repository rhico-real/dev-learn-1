import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { OrgMembershipService } from './org-membership.service';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import * as interfaces from '../../../shared/types/interfaces';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('organizations')
export class OrgMembershipController {
    constructor(private orgMembershipService: OrgMembershipService) {}

    @Post(':id/members')
    async addMember(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') orgId: string,
        @Body() dto: AddMemberDto,
    ) {
        await this.orgMembershipService.verifyRole(user.userId, orgId, 'ADMIN');
        return this.orgMembershipService.addMember(
            orgId,
            dto.userId,
            dto.role!,
        );
    }

    @Get(':id/members')
    listMembers(@Param('id') orgId: string) {
        return this.orgMembershipService.listMembers(orgId);
    }

    @Get(':id/members/find')
    findMember(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') orgId: string,
    ) {
        return this.orgMembershipService.findByUserAndOrg(user.userId, orgId);
    }

    @Patch(':id/members/:userId')
    async updateMember(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') orgId: string,
        @Param('userId') userId: string,
        @Body() dto: UpdateRoleDto,
    ) {
        await this.orgMembershipService.verifyRole(user.userId, orgId, 'OWNER');
        return this.orgMembershipService.updateRole(orgId, userId, dto.role);
    }

    @Delete(':id/members/:userId')
    async deleteMember(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') orgId: string,
        @Param('userId') userId: string,
    ) {
        await this.orgMembershipService.verifyRole(user.userId, orgId, 'ADMIN');
        return this.orgMembershipService.removeMember(orgId, userId);
    }
}
