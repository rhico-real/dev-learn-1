import { Module } from '@nestjs/common';
import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';
import { IdentityContextModule } from '../../identity/identity-context.module';
import { OrganizationContextModule } from '../../organization/organization-context.module';
import { EventModule } from '../../event/event/event.module';

@Module({
    imports: [IdentityContextModule, OrganizationContextModule, EventModule],
    controllers: [FollowController],
    exports: [FollowService],
    providers: [FollowService],
})
export class FollowModule {}
