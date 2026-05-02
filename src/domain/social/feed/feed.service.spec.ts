import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CacheService } from '../../../infrastructure/cache/cache.service';

describe('Feed service', () => {
    let service: FeedService;

    let mockPrisma = {
        postLike: {
            findUnique: jest.fn(),
        },
        follow: {
            findMany: jest.fn(),
        },
        post: {
            findMany: jest.fn(),
        },
    };

    let mockFeed = {
        id: 'feed-id-123',
        content: 'Test Content',
        createdAt: new Date('2026-04-16'),
        author: {
            id: 'author-id-123',
            displayName: 'Author name',
            avatar: 'https://avatar.com',
        },
        _count: {
            likes: 1,
            comments: 1,
        },
    };

    let mockCacheService = {
        get: jest.fn(),
        set: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FeedService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: CacheService, useValue: mockCacheService },
            ],
        }).compile();

        service = module.get<FeedService>(FeedService);
        jest.resetAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-04-27T07:32:11.223Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('list feed', () => {
        it('should show list of feed from my following posts', async () => {
            mockPrisma.follow.findMany.mockResolvedValue([
                { targetId: 'author-id-123' },
            ]);
            mockPrisma.post.findMany.mockResolvedValue([mockFeed]);

            const result = await service.listFeed('user-id-123');

            // destructure
            const { _count, ...feed } = mockFeed;

            expect(result).toEqual({
                data: [
                    {
                        ...feed,
                        likedByMe: false,
                        counts: { likes: 1, comments: 1 },
                    },
                ],
                meta: {
                    cursor: 'feed-id-123',
                },
            });
            expect(mockCacheService.get).toHaveBeenCalledWith(
                'runhop:feed:user-id-123',
            );
            expect(mockCacheService.set).toHaveBeenCalledWith(
                'runhop:feed:user-id-123',
                {
                    data: [
                        {
                            ...feed,
                            likedByMe: false,
                            counts: { likes: 1, comments: 1 },
                        },
                    ],
                    meta: {
                        cursor: 'feed-id-123',
                    },
                },
                30,
            );
        });
    });
});
