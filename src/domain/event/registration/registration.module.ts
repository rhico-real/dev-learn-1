import { Module } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { RaceModule } from '../race/race.module';
import { OrganizationContextModule } from '../../organization/organization-context.module';

@Module({
    imports: [OrganizationContextModule, RaceModule],
    providers: [RegistrationService],
    exports: [RegistrationService],
    controllers: [RegistrationController],
})
export class RegistrationModule {}
