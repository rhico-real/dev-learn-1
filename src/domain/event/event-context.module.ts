import { Module } from '@nestjs/common';
import { RaceModule } from './race/race.module';
import { RegistrationModule } from './registration/registration.module';
import { OrganizationContextModule } from '../organization/organization-context.module';
import { EventModule } from './event/event.module';
import { PaymentModule } from './payment/payment.module';

@Module({
    imports: [
        EventModule,
        RaceModule,
        RegistrationModule,
        OrganizationContextModule,
        PaymentModule,
    ],
    exports: [EventModule, RaceModule, RegistrationModule, PaymentModule],
})
export class EventContextModule {}
