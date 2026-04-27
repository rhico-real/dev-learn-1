import { Test, TestingModule } from '@nestjs/testing';
import { ReactionService } from './reaction.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PostService } from '../post/post.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Reaction service', () => {
    let service: ReactionService;

    let mockPrisma = {
        postLike: {
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
        postComment: {
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    let mockPostService = {
        findById: jest.fn(),
        exists: jest.fn(),
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

    let mockEventEmitter = {
        emit: jest.fn(),
    };

    let mockComment = {
        id: 'comment-id-123',
        postId: 'post-id-123',
        authorId: 'author-id-123',
        content: 'Test comment',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReactionService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: PostService, useValue: mockPostService },
                { provide: EventEmitter2, useValue: mockEventEmitter },
            ],
        }).compile();

        service = module.get<ReactionService>(ReactionService);
        jest.resetAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-04-27T07:32:11.223Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
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

    // Get comment
    describe('get comments', () => {
        it('should return list of comments', async () => {
            mockPrisma.postComment.findMany.mockResolvedValue([mockComment]);
            const result = await service.listComments('post-id-123');

            expect(result).toEqual({
                data: [mockComment],
                meta: {
                    cursor: 'comment-id-123',
                },
            });
        });
    });

    // Create comment
    describe('create comment', () => {
        it('should be able to create comment', async () => {
            mockPostService.exists.mockResolvedValue(mockPostRecord);
            mockEventEmitter.emit.mockReturnValue(true);
            mockPrisma.postComment.create.mockResolvedValue(mockComment);

            const result = await service.createComment(
                'post-id-123',
                'author-id-123',
                { content: 'Test comment' },
            );

            expect(result).toEqual(mockComment);
            expect(mockPrisma.postComment.create).toHaveBeenCalledWith({
                data: {
                    postId: 'post-id-123',
                    authorId: 'author-id-123',
                    content: 'Test comment',
                },
            });
        });

        it('should return NotFoundException if post is not found', async () => {
            mockPostService.exists.mockResolvedValue(null);
            await expect(
                service.createComment('post-id-123', 'author-id-123', {
                    content: 'Test comment',
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // Update comment
    describe('update comment', () => {
        it('should be able to update comment', async () => {
            mockPrisma.postComment.update.mockResolvedValue({
                ...mockComment,
                content: 'Updated comment',
            });

            const result = await service.updateComment(
                'comment-id-123',
                'author-id-123',
                { content: 'Updated comment' },
            );

            expect(result).toEqual({
                ...mockComment,
                content: 'Updated comment',
            });
        });

        it('should return NotFoundException if comment not found', async () => {
            const error = new Prisma.PrismaClientKnownRequestError(
                'Record not found',
                { code: 'P2025', clientVersion: '5.0.0' },
            );

            mockPrisma.postComment.update.mockRejectedValue(error);

            await expect(
                service.updateComment('comment-id-123', 'author-id-123', {
                    content: 'Updated comment',
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // Delete comment
    describe('delete comment', () => {
        it('should be able to delete comment', async () => {
            mockPrisma.postComment.update.mockResolvedValue({
                ...mockComment,
                deletedAt: new Date('2026-04-17T01:36:59.185Z'),
            });
            const result = await service.removeComment(
                'comment-id-123',
                'author-id-123',
            );
            expect(result).toEqual({
                ...mockComment,
                deletedAt: new Date('2026-04-17T01:36:59.185Z'),
            });
        });

        it('should return NotFoundException if comment not found', async () => {
            const error = new Prisma.PrismaClientKnownRequestError(
                'Record not found',
                { code: 'P2025', clientVersion: '5.0.0' },
            );

            mockPrisma.postComment.update.mockRejectedValue(error);

            await expect(
                service.removeComment('comment-id-123', 'author-id-123'),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
