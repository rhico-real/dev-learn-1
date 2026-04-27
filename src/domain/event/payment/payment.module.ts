import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { OrganizationContextModule } from '../../organization/organization-context.module';
import { RegistrationModule } from '../registration/registration.module';
import { RaceModule } from '../race/race.module';
import { EventModule } from '../event/event.module';

@Module({
    imports: [
        RegistrationModule,
        RaceModule,
        OrganizationContextModule,
        EventModule,
    ],
    controllers: [PaymentController],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule {}
