import { Body, Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import * as interfaces from '../../../shared/types/interfaces';
import { PaginationQueryDTO } from '../../../shared/dto/pagination-query.dto';
import { FeedService } from './feed.service';

@Controller()
export class FeedController {
    constructor(private feedService: FeedService) {}

    @Get('feed')
    async listFeed(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Query() dto: PaginationQueryDTO,
    ) {
        return this.feedService.listFeed(user.userId, dto.cursor, dto.limit);
    }
}
