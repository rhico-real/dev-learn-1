import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationProcessor } from '../../../infrastructure/queue/processors/notification.processor';

@Module({
    controllers: [NotificationController],
    providers: [NotificationService, NotificationProcessor],
})
export class NotificationModule {}
