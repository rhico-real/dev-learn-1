import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private client: Redis;

    constructor(private configService: ConfigService) {
        this.client = new Redis({
            host: this.configService.get<string>('REDIS_HOST'),
            port: this.configService.get<number>('REDIS_PORT')
        });
    }
    async get(key: string) {
        return this.client.get(key);
    }

    async set(key: string, value: string) {
        return this.client.set(key, value);
    }

    async del(key: string) {
        return this.client.del(key);
    }

    async delByPattern(pattern: string) {
        const stream = this.client.scanStream({
            match: pattern,
            count: 100
        });

        stream.on('data', async (keys: string[]) => {
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        });

        return new Promise((resolve) => stream.on('end', resolve));
    }

    async setex(key: string, seconds: number, value: string) {
        return this.client.setex(key, seconds, value);
    }

    async onModuleDestroy() {
        await this.client.quit();
    }
}