import { Module } from '@nestjs/common';
import { RaceModule } from './race/race.module';
import { RegistrationModule } from './registration/registration.module';
import { OrganizationContextModule } from '../organization/organization-context.module';
import { EventModule } from './event/event.module';

@Module({
  imports: [
    EventModule,
    RaceModule,
    RegistrationModule,
    OrganizationContextModule,
  ],
  exports: [EventModule, RaceModule, RegistrationModule],
})
export class EventContextModule {}
