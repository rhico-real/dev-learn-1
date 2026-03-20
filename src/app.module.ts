import { Module } from '@nestjs/common';
import { AppConfigModule } from './infrastructure/config/config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, RedisModule]
})
export class AppModule {}
