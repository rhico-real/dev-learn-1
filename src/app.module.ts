import { Module } from '@nestjs/common';
import { AppConfigModule } from './infrastructure/config/config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { SharedModule } from './shared/shared.module';
import { IdentityContextModule } from './domain/identity/identity-context.module';
import { OrganizationContextModule } from './domain/organization/organization-context.module';
import { CommonModule } from './common/common.module';
import { EventContextModule } from './domain/event/event-context.module';
import { SocialContextModule } from './domain/social/social-context.module';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        AppConfigModule,
        DatabaseModule,
        RedisModule,
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 100,
            },
        ]),
        SharedModule,
        IdentityContextModule,
        OrganizationContextModule,
        CommonModule,
        EventContextModule,
        SocialContextModule,
        HealthModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}
