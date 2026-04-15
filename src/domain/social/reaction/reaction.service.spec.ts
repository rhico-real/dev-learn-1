import { Test, TestingModule } from '@nestjs/testing';
import { ReactionService } from './reaction.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PostService } from '../post/post.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('Reaction service', () => {
    let service: ReactionService;

    let mockPrisma = {
        postLike: {
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
    };

    let mockPostService = {
        findById: jest.fn(),
    };

    let mockPostRecord = {
        id: 'post-id-123',
        authorId: 'author-id-123',
        content: 'Test post content',
    };

    let mockLikeRecord = {
        id: 'like-id-123',
        postId: 'post-id-123',
        userId: 'author-id-123',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReactionService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: PostService, useValue: mockPostService },
            ],
        }).compile();

        service = module.get<ReactionService>(ReactionService);
        jest.clearAllMocks();
    });

    /**
     * Like
     * - return ok if liking a post
     * - should return NotFoundException if post is not found
     * - should return ConflictException if duplicate like
     */
    describe('like', () => {
        it('should return like record if post is liked', async () => {
            mockPostService.findById.mockResolvedValue(mockPostRecord);
            mockPrisma.postLike.create.mockResolvedValue(mockLikeRecord);
            const result = await service.like('post-id-123', 'author-id-123');

            expect(result).toEqual(mockLikeRecord);
        });

        it('should return NotFoundException if post is not found', async () => {
            mockPostService.findById.mockResolvedValue(null);
            await expect(
                service.like('post-id-124', 'author-id-123'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should return ConflictException if duplicate like', async () => {
            mockPostService.findById.mockResolvedValue(mockPostRecord);

            const prismaError = new Prisma.PrismaClientKnownRequestError(
                'Unique constraint failed on the fields: (postId, userId)',
                { code: 'P2002', clientVersion: '5.0.0' },
            );

            mockPrisma.postLike.create.mockRejectedValue(prismaError);

            await expect(
                service.like('post-id-123', 'author-id-123'),
            ).rejects.toThrow(ConflictException);
        });
    });

    /**
     * Unlike
     * - return ok if unliked a post
     * - should return NotFoundException if like record not found
     */
    describe('unlike', () => {
        it('should return post if post is unliked', async () => {
            mockPrisma.postLike.delete.mockResolvedValue(mockLikeRecord);
            const result = await service.unlike('like-id-123');
            expect(result).toEqual(mockLikeRecord);
        });

        it('should return NotFoundException if like record is not found', async () => {
            const prismaError = new Prisma.PrismaClientKnownRequestError(
                'Random error message from Prisma',
                { code: 'P2025', clientVersion: '5.0.0' },
            );

            mockPrisma.postLike.delete.mockRejectedValue(prismaError);

            await expect(service.unlike('like-id-123')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
