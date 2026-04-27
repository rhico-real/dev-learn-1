import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('NotificationService', () => {
    let service: NotificationService;

    let mockPrisma = {
        post: {
            findUnique: jest.fn(),
        },
        notification: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            count: jest.fn(),
        },
    };

    let mockPostRecord = {
        id: 'post-id-123',
        authorId: 'author-id-123',
        content: 'Test post content',
    };

    let mockNotificationRecord = {
        id: 'notification-id-123',
        recipientId: 'author-id-123',
        postId: 'post-id-123',
        actorId: 'actor-id-123',
        type: NotificationType.POST_LIKED,
    };

    let mockNotifCommentRecord = {
        id: 'notification-id-124',
        recipientId: 'author-id-123',
        postId: 'post-id-123',
        actorId: 'actor-id-123',
        commentId: 'comment-id-123',
        type: NotificationType.POST_COMMENTED,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<NotificationService>(NotificationService);
        jest.resetAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-04-27T07:32:11.223Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('create like record', () => {
        it('should create a like record', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPostRecord);
            mockPrisma.notification.create.mockResolvedValue(
                mockNotificationRecord,
            );

            const result = await service.createLikeNotification({
                actorId: 'actor-id-123',
                postId: 'post-id-123',
            });

            expect(result).toEqual(mockNotificationRecord);
        });

        it('should throw NotFoundException if post is not found', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(null);
            await expect(
                service.createLikeNotification({
                    actorId: 'actor-id-123',
                    postId: 'post-id-124',
                }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should return null if post author is actor', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPostRecord);

            const result = await service.createLikeNotification({
                actorId: 'author-id-123',
                postId: 'post-id-123',
            });

            expect(result).toBe(null);
        });
    });

    describe('create comment record', () => {
        it('should create a comment record', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPostRecord);
            mockPrisma.notification.create.mockResolvedValue(
                mockNotifCommentRecord,
            );

            const result = await service.createCommentNotification({
                actorId: 'actor-id-123',
                postId: 'post-id-123',
                commentId: 'comment-id-123',
            });

            expect(result).toEqual(mockNotifCommentRecord);
        });

        it('should throw NotFoundException if post is not found', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(null);
            await expect(
                service.createCommentNotification({
                    actorId: 'actor-id-123',
                    postId: 'post-id-124',
                    commentId: 'comment-id-123',
                }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should return null if post author is actor', async () => {
            mockPrisma.post.findUnique.mockResolvedValue(mockPostRecord);

            const result = await service.createCommentNotification({
                actorId: 'author-id-123',
                postId: 'post-id-123',
                commentId: 'comment-id-123',
            });

            expect(result).toBe(null);
        });
    });

    describe('list notifications for user', () => {
        it('should return list of notifications', async () => {
            mockPrisma.notification.findMany.mockResolvedValue([
                mockNotificationRecord,
            ]);

            const result = await service.listForUser('author-id-123');

            expect(result).toEqual({
                data: [mockNotificationRecord],
                meta: {
                    cursor: 'notification-id-123',
                },
            });
        });
    });

    describe('mark as read', () => {
        it('should mark notification as read', async () => {
            mockPrisma.notification.findUnique.mockResolvedValue(
                mockNotificationRecord,
            );
            mockPrisma.notification.update.mockResolvedValue({
                ...mockNotificationRecord,
                readAt: new Date(),
            });

            const result = await service.markAsRead(
                'notification-id-123',
                'author-id-123',
            );

            expect(result).toEqual({
                ...mockNotificationRecord,
                readAt: new Date(),
            });
        });

        it('should return NotFoundException if notification is not found', async () => {
            mockPrisma.notification.findUnique.mockResolvedValue(null);

            await expect(
                service.markAsRead('notification-id-123', 'author-id-123'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('mark all as read', () => {
        it('should mark all notification as read', async () => {
            mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

            const result = await service.markAllAsRead('author-id-123');

            expect(result).toEqual({ count: 1 });
        });
    });

    describe('get unread count', () => {
        it('should count all unread notifications', async () => {
            mockPrisma.notification.count.mockResolvedValue(1);

            const result = await service.getUnreadCount('author-id-123');

            expect(result).toEqual(1);
        });
    });
});
