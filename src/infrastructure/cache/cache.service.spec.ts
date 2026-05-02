import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { RedisService } from '../redis/redis.service';

describe('Cache Service', () => {
    let service: CacheService;

    let mockRedis = {
        get: jest.fn(),
        set: jest.fn(),
        setex: jest.fn(),
        del: jest.fn(),
        delByPattern: jest.fn(),
    };
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CacheService,
                { provide: RedisService, useValue: mockRedis },
            ],
        }).compile();

        service = module.get<CacheService>(CacheService);
    });

    it('returns null on cache miss', async () => {
        mockRedis.get.mockResolvedValue(null);
        const result = await service.get('test');

        expect(result).toBeNull;
    });

    it('returns parsed JSON on cache hit', async () => {
        mockRedis.get.mockResolvedValue(
            JSON.stringify({ id: '1', name: 'test' }),
        );
        const result = await service.get<{ id: string; name: string }>('test');

        expect(result).toEqual({ id: '1', name: 'test' });
    });

    it('serializes value as JSON when setting', async () => {
        const result = await service.set('test', { id: '1', name: 'test' }, 60);
        expect(mockRedis.setex).toHaveBeenCalledWith(
            'test',
            60,
            JSON.stringify({ id: '1', name: 'test' }),
        );
    });

    it('deletes a key', async () => {
        await service.del('test');
        expect(mockRedis.del).toHaveBeenCalledWith('test');
    });
});
