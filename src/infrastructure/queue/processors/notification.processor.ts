import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { QUEUE_NAMES } from '../queue.constants';
import { PrismaService } from '../../database/prisma.service';
import { Job } from 'bullmq';

type NotificationJobData = {
    type: 'POST_LIKE' | 'POST_COMMENT' | 'FOLLOW' | 'PAYMENT_APPROVED';
    actorId: string;
    postId: string;
    commentId: string;
    recipientId: string;
};

const TYPE_MAP: Record<NotificationJobData['type'], NotificationType> = {
    POST_LIKE: NotificationType.POST_LIKED,
    POST_COMMENT: NotificationType.POST_COMMENTED,
    FOLLOW: NotificationType.FOLLOW,
    PAYMENT_APPROVED: NotificationType.PAYMENT_APPROVED,
};

@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
    constructor(private prisma: PrismaService) {
        super();
    }

    async handleNotification(job: Job<NotificationJobData>): Promise<void> {
        const { type, actorId, postId, commentId, recipientId } = job.data;

        if (type === 'POST_LIKE' || type === 'POST_COMMENT') {
            const post = await this.prisma.post.findUnique({
                where: { id: postId },
                select: { authorId: true },
            });

            if (!post || post.authorId === actorId) return;

            await this.prisma.notification.create({
                data: {
                    recipientId: post.authorId,
                    actorId,
                    postId,
                    commentId,
                    type: TYPE_MAP[type],
                },
            });

            return;
        }

        if ((type === 'FOLLOW' || type === 'PAYMENT_APPROVED') && recipientId) {
            await this.prisma.notification.create({
                data: {
                    recipientId,
                    actorId,
                    postId,
                    commentId,
                    type: TYPE_MAP[type],
                },
            });
        }
    }

    async process(job: Job<NotificationJobData>): Promise<any> {
        await this.handleNotification(job);
    }
}
