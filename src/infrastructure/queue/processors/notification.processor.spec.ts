import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProcessor } from './notification.processor';
import { PrismaService } from '../../database/prisma.service';
import { Job } from 'bullmq';
import { FCMService } from '../../../domain/social/notification/fcm.service';

describe('NotificationProcessor', () => {
    let processor: NotificationProcessor;
    let prisma: {
        post: {
            findUnique: jest.Mock;
        };
        notification: {
            create: jest.Mock;
        };
        deviceToken: {
            findMany: jest.Mock;
        };
    };

    let mockFcmService = {
        sendToToken: jest.fn(),
    };

    beforeEach(async () => {
        prisma = {
            post: { findUnique: jest.fn() },
            notification: { create: jest.fn() },
            deviceToken: { findMany: jest.fn() },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationProcessor,
                { provide: PrismaService, useValue: prisma },
                { provide: FCMService, useValue: mockFcmService },
            ],
        }).compile();

        processor = module.get<NotificationProcessor>(NotificationProcessor);
    });

    it('creates a POST_LIKED notification when actor is not the post author', async () => {
        prisma.post.findUnique.mockResolvedValue({ authorId: 'user-2' });
        prisma.notification.create.mockResolvedValue({ id: 'notif-1' });
        prisma.deviceToken.findMany.mockResolvedValue([
            { token: 'test-token' },
        ]);

        const job = {
            data: {
                type: 'POST_LIKE',
                actorId: 'user-1',
                postId: 'post-1',
            },
        } as Job;

        await processor.handleNotification(job);

        expect(prisma.notification.create).toHaveBeenCalledWith({
            data: {
                recipientId: 'user-2',
                actorId: 'user-1',
                postId: 'post-1',
                commentId: undefined,
                type: 'POST_LIKED',
            },
        });

        expect(mockFcmService.sendToToken).toHaveBeenCalledWith(
            'test-token',
            'RunHop',
            'Someone liked your post',
            {
                type: 'POST_LIKE',
                postId: 'post-1',
            },
        );
    });

    it('creates a POST_COMMENT notification when actor is not the post author', async () => {
        prisma.post.findUnique.mockResolvedValue({ authorId: 'user-2' });
        prisma.notification.create.mockResolvedValue({ id: 'notif-1' });
        prisma.deviceToken.findMany.mockResolvedValue([
            { token: 'test-token' },
        ]);

        const job = {
            data: {
                type: 'POST_COMMENT',
                actorId: 'user-1',
                postId: 'post-1',
                commentId: 'comment-id-1',
            },
        } as Job;

        await processor.handleNotification(job);

        expect(prisma.notification.create).toHaveBeenCalledWith({
            data: {
                recipientId: 'user-2',
                actorId: 'user-1',
                postId: 'post-1',
                commentId: 'comment-id-1',
                type: 'POST_COMMENTED',
            },
        });

        expect(mockFcmService.sendToToken).toHaveBeenCalledWith(
            'test-token',
            'RunHop',
            'Someone commented your post',
            {
                type: 'POST_COMMENT',
                postId: 'post-1',
            },
        );
    });

    it('creates a FOLLOW notification', async () => {
        prisma.notification.create.mockResolvedValue({ id: 'notif-1' });
        prisma.deviceToken.findMany.mockResolvedValue([
            { token: 'test-token' },
        ]);

        const job = {
            data: {
                type: 'FOLLOW',
                actorId: 'follower-1',
                recipientId: 'target-1',
            },
        } as Job;

        await processor.handleNotification(job);

        expect(prisma.notification.create).toHaveBeenCalledWith({
            data: {
                recipientId: 'target-1',
                actorId: 'follower-1',
                type: 'FOLLOW',
            },
        });

        expect(mockFcmService.sendToToken).toHaveBeenCalledWith(
            'test-token',
            'RunHop',
            'Someone followed you',
            {
                type: 'FOLLOW',
            },
        );
    });

    it('creates a PAYMENT_APPROVED notification', async () => {
        prisma.notification.create.mockResolvedValue({ id: 'notif-1' });
        prisma.deviceToken.findMany.mockResolvedValue([
            { token: 'test-token' },
        ]);

        const job = {
            data: {
                type: 'PAYMENT_APPROVED',
                actorId: 'reviewer-1',
                recipientId: 'payor-1',
            },
        } as Job;

        await processor.handleNotification(job);

        expect(prisma.notification.create).toHaveBeenCalledWith({
            data: {
                actorId: 'reviewer-1',
                recipientId: 'payor-1',
                type: 'PAYMENT_APPROVED',
            },
        });

        expect(mockFcmService.sendToToken).toHaveBeenCalledWith(
            'test-token',
            'RunHop',
            'Your payment has been approved',
            {
                type: 'PAYMENT_APPROVED',
            },
        );
    });

    it('skips notification when actor is the post author', async () => {
        prisma.post.findUnique.mockResolvedValue({ authorId: 'user-1' });

        const job = {
            data: {
                type: 'POST_LIKE',
                actorId: 'user-1',
                postId: 'post-1',
            },
        } as Job;

        await processor.handleNotification(job);

        expect(prisma.notification.create).not.toHaveBeenCalledWith();
    });
});
