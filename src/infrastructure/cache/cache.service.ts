import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheService {
    constructor(private redis: RedisService) {}

    async get<T>(key: string): Promise<T | null> {
        const raw = await this.redis.get(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    }

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async delByPattern(pattern: string): Promise<void> {
        await this.redis.delByPattern(pattern);
    }
}
