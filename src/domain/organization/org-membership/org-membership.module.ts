import { Module } from '@nestjs/common';
import { UserModule } from '../../identity/user/user.module';
import { OrgMembershipService } from './org-membership.service';
import { OrgMembershipController } from './org-membership.controller';

@Module({
    imports: [UserModule],
    controllers: [OrgMembershipController],
    providers: [OrgMembershipService],
    exports: [OrgMembershipService],
})
export class OrgMembershipModule {}
