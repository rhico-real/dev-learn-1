import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import * as interfaces from '../../../shared/types/interfaces';
import { PaginationQueryDTO } from '../../../shared/dto/pagination-query.dto';

@Controller('notifications')
export class NotificationController {
    constructor(private notificationService: NotificationService) {}

    @Get()
    async listForUsers(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Query() dto: PaginationQueryDTO,
    ) {
        return this.notificationService.listForUser(
            user.userId,
            dto.cursor,
            dto.limit,
        );
    }

    @Get('unread-count')
    async getUnreadCount(@CurrentUser() user: interfaces.AuthenticatedUser) {
        return this.notificationService.getUnreadCount(user.userId);
    }

    @Patch(':id/read')
    async markAsRead(
        @Param('id') id: string,
        @CurrentUser() user: interfaces.AuthenticatedUser,
    ) {
        await this.notificationService.ownershipCheck(id, user.userId);
        return this.notificationService.markAsRead(id, user.userId);
    }

    @Patch('read-all')
    async markAsReadAll(@CurrentUser() user: interfaces.AuthenticatedUser) {
        return this.notificationService.markAllAsRead(user.userId);
    }
}
