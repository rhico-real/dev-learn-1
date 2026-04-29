import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProcessor } from './notification.processor';
import { PrismaService } from '../../database/prisma.service';
import { Job } from 'bullmq';

describe('NotificationProcessor', () => {
    let processor: NotificationProcessor;
    let prisma: {
        post: {
            findUnique: jest.Mock;
        };
        notification: {
            create: jest.Mock;
        };
    };

    beforeEach(async () => {
        prisma = {
            post: { findUnique: jest.fn() },
            notification: { create: jest.fn() },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationProcessor,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        processor = module.get<NotificationProcessor>(NotificationProcessor);
    });

    it('creates a POST_LIKED notification when actor is not the post author', async () => {
        prisma.post.findUnique.mockResolvedValue({ authorId: 'user-2' });
        prisma.notification.create.mockResolvedValue({ id: 'notif-1' });

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
