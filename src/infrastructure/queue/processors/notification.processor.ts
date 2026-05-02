import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { QUEUE_NAMES } from '../queue.constants';
import { PrismaService } from '../../database/prisma.service';
import { Job } from 'bullmq';
import { FCMService } from '../../../domain/social/notification/fcm.service';

type NotificationJobData = {
    type:
        | 'POST_LIKE'
        | 'POST_COMMENT'
        | 'FOLLOW'
        | 'PAYMENT_APPROVED'
        | 'PAYMENT_REJECTED';
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
    PAYMENT_REJECTED: NotificationType.PAYMENT_REJECTED,
};

const PUSH_MESSAGES: Record<
    NotificationJobData['type'],
    { title: string; body: string }
> = {
    POST_LIKE: { title: 'RunHop', body: 'Someone liked your post' },
    POST_COMMENT: { title: 'RunHop', body: 'Someone commented your post' },
    FOLLOW: { title: 'RunHop', body: 'Someone followed you' },
    PAYMENT_APPROVED: {
        title: 'RunHop',
        body: 'Your payment has been approved',
    },
    PAYMENT_REJECTED: {
        title: 'RunHop',
        body: 'Your payment has been rejected',
    },
};

@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
    constructor(
        private prisma: PrismaService,
        private fcmService: FCMService,
    ) {
        super();
    }

    async handleNotification(job: Job<NotificationJobData>): Promise<void> {
        const { type, actorId, postId, commentId, recipientId } = job.data;
        let resolvedRecipientId: string | null = null;

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

            resolvedRecipientId = post.authorId;
        } else if (
            (type === 'FOLLOW' || type === 'PAYMENT_APPROVED') &&
            recipientId
        ) {
            await this.prisma.notification.create({
                data: {
                    recipientId,
                    actorId,
                    type: TYPE_MAP[type],
                },
            });

            resolvedRecipientId = recipientId;
        }

        if (!resolvedRecipientId) return;

        // get the tokens of all resolved recipients of notification
        const tokens = await this.prisma.deviceToken.findMany({
            where: { userId: resolvedRecipientId },
            select: {
                token: true,
            },
        });

        const { title, body } = PUSH_MESSAGES[type];

        /**
         * Send FCM notifications on all tokens involved
         * Params neded:
         * - token
         * - title
         * - body
         * - data -> {type, postId?}
         */
        await Promise.all(
            tokens.map((dt) => {
                this.fcmService.sendToToken(dt.token, title, body, {
                    type,
                    ...(postId ? { postId } : {}),
                });
            }),
        );
    }

    async process(job: Job<NotificationJobData>): Promise<any> {
        await this.handleNotification(job);
    }
}
