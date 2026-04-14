import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { Public } from '../shared/decorators/public.decorator';

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private prisma: PrismaService,
        private redis: RedisService,
    ) {}

    /**
     * Health Check:
     * 1. Check
     * 2. Ping
     */

    @Public()
    @Get()
    @HealthCheck()
    async check() {
        return this.health.check([
            // Database health
            async (): Promise<HealthIndicatorResult> => {
                try {
                    await this.prisma.$queryRaw`SELECT 1`;
                    return { database: { status: 'up' } };
                } catch {
                    return { database: { status: 'down' } };
                }
            },

            // Redis health
            async (): Promise<HealthIndicatorResult> => {
                try {
                    await this.redis.ping();
                    return { redis: { status: 'up' } };
                } catch {
                    return { redis: { status: 'down' } };
                }
            },
        ]);
    }
}
