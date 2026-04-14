import { Module } from '@nestjs/common';
import { OrganizationModule } from './organization/organization.module';
import { OrgMembershipModule } from './org-membership/org-membership.module';

@Module({
    imports: [OrganizationModule, OrgMembershipModule],
    exports: [OrganizationModule, OrgMembershipModule],
})
export class OrganizationContextModule {}
