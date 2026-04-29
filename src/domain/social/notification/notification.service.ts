import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';

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
