import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from './queue.constants';

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('REDIS_HOST'),
                    port: configService.get<number>('REDIS_PORT'),
                },
            }),
        }),
        BullModule.registerQueue(
            { name: QUEUE_NAMES.NOTIFICATION },
            { name: QUEUE_NAMES.REGISTRATION },
        ),
    ],
    exports: [BullModule],
})
export class QueueModel {}
