import { Module } from '@nestjs/common';
import { OrgMembershipModule } from '../org-membership/org-membership.module';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
    imports: [OrgMembershipModule],
    controllers: [OrganizationController],
    providers: [OrganizationService],
    exports: [OrganizationService],
})
export class OrganizationModule {}
