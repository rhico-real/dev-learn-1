import { Module } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { RaceModule } from '../race/race.module';
import { OrganizationContextModule } from '../../organization/organization-context.module';
import { RegistrationProcessor } from '../../../infrastructure/queue/processors/registration.processor';

@Module({
    imports: [OrganizationContextModule, RaceModule],
    providers: [RegistrationService, RegistrationProcessor],
    exports: [RegistrationService],
    controllers: [RegistrationController],
})
export class RegistrationModule {}
