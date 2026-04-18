import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PostService } from '../post/post.service';
import { NotificationType, Prisma } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationEventTypes } from './notification-events';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) {}

    private async findById(notificationId: string) {
        return this.prisma.notification.findUnique({
            where: { id: notificationId },
        });
    }

    async ownershipCheck(notificationId: string, userId: string) {
        const notification = await this.prisma.notification.findUnique({
            where: {
                id: notificationId,
            },
        });

        if (!notification)
            throw new NotFoundException('Notification not found');

        if (notification.recipientId !== userId)
            throw new ForbiddenException(
                'You do not have access to this notification',
            );

        return notification;
    }

    @OnEvent(NotificationEventTypes.POST_LIKE)
    async createLikeNotification(dto: CreateNotificationDto) {
        const post = await this.prisma.post.findUnique({
            where: { id: dto.postId },
            select: { authorId: true },
        });

        if (!post) throw new NotFoundException('Post not found');

        if (post.authorId === dto.actorId) return null;

        return this.prisma.notification.create({
            data: {
                recipientId: post.authorId,
                actorId: dto.actorId,
                postId: dto.postId,
                type: NotificationType.POST_LIKED,
            },
        });
    }

    @OnEvent(NotificationEventTypes.POST_COMMENT)
    async createCommentNotification(dto: CreateNotificationDto) {
        const post = await this.prisma.post.findUnique({
            where: { id: dto.postId },
            select: { authorId: true },
        });

        if (!post) throw new NotFoundException('Post not found');

        if (post.authorId === dto.actorId) return null;

        return this.prisma.notification.create({
            data: {
                recipientId: post.authorId,
                actorId: dto.actorId,
                postId: dto.postId,
                commentId: dto.commentId,
                type: NotificationType.POST_COMMENTED,
            },
        });
    }

    async listForUser(userId: string, cursor?: string, take: number = 20) {
        const args: Prisma.NotificationFindManyArgs = {
            take,
            where: { recipientId: userId },
            orderBy: { createdAt: 'desc' },
        };

        if (cursor) {
            args.skip = 1;
            args.cursor = { id: cursor };
        }

        const notifications = await this.prisma.notification.findMany(args);
        const nextCursor = notifications.at(-1)?.id;

        return {
            data: notifications,
            meta: {
                cursor: nextCursor,
            },
        };
    }

    async markAsRead(notificationId: string, userId: string) {
        const notification = await this.findById(notificationId);

        if (!notification)
            throw new NotFoundException('Notification not found');

        try {
            return await this.prisma.notification.update({
                where: { id: notificationId, recipientId: userId },
                data: {
                    readAt: new Date(),
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundException('Notification not found');
            }

            throw error;
        }
    }

    async markAllAsRead(userId: string) {
        return await this.prisma.notification.updateMany({
            where: { recipientId: userId, readAt: null },
            data: {
                readAt: new Date(),
            },
        });
    }

    async getUnreadCount(userId: string) {
        return await this.prisma.notification.count({
            where: { recipientId: userId, readAt: null },
        });
    }
}
