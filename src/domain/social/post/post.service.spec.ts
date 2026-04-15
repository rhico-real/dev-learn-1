import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Post Service', () => {
    let service: PostService;

    let mockPrisma = {
        post: {
            create: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            delete: jest.fn(),
        },
    };

    let mockPost = {
        id: 'post-id-123',
        authorId: 'author-id-123',
        content: 'Test post content',
    };

    let mockPostDeleted = {
        id: 'post-id-123',
        authorId: 'author-id-123',
        content: 'Test post content',
        deletedAt: new Date('2026-04-14'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<PostService>(PostService);
        jest.clearAllMocks();
    });

    describe('create post', () => {
        it('should create a post', async () => {
            mockPrisma.post.create.mockResolvedValue(mockPost);
            const result = await service.create(
                'author-id-123',
                'Test post content',
            );
            expect(result).toEqual(mockPost);
            expect(mockPrisma.post.create).toHaveBeenCalledWith({
                data: {
                    authorId: 'author-id-123',
                    content: 'Test post content',
                },
            });
        });

        it('should return BadRequestException if content is empty', async () => {
            await expect(service.create('author-id-123', '')).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('update post', () => {
        it('should be able to update post', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPost);
            mockPrisma.post.update.mockResolvedValue(mockPost);

            const result = await service.update(
                'post-id-123',
                'Test post content',
            );
            expect(result).toBe(mockPost);
        });

        it('should return NotFoundException if post is not found', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(null);

            await expect(
                service.update('post-id-123', 'Test post content'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete post', () => {
        it('should be able to delete post', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPost);
            mockPrisma.post.update.mockResolvedValue(mockPostDeleted);

            const result = await service.delete('post-id-123');
            expect(result).toBe(mockPostDeleted);
        });

        it('should return NotFoundException if post is not found', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(null);

            await expect(service.delete('post-id-123')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('list posts of user', () => {
        it('should be able to list post of user', async () => {
            mockPrisma.post.findMany.mockResolvedValue([mockPost]);

            const result = await service.listByUser('author-id-123');
            expect(result).toEqual({
                data: [mockPost],
                meta: { cursor: 'post-id-123' },
            });
        });
    });

    describe('find post by id', () => {
        it('should return post if found', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPost);

            const result = await service.findById('post-id-123');
            expect(result).toEqual(mockPost);
        });
    });

    describe('check if post exists', () => {
        it('should return true if post is found', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPost);

            const result = await service.exists('post-id-123');
            expect(result).toBe(true);
        });

        it('should return false if post is not found', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(null);

            const result = await service.exists('post-id-124');
            expect(result).toBe(false);
        });
    });
});
