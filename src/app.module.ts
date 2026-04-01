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
import { EventModule } from './domain/event/event/event.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100
    }]),
    SharedModule,
    IdentityContextModule,
    OrganizationContextModule,
    CommonModule,
    EventModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule { }
