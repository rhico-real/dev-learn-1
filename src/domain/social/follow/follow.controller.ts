import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import * as interfaces from '../../../shared/types/interfaces';
import { CreateFollowDto } from './dto/create-follow.dto';

@Controller()
export class FollowController {
    constructor(private followService: FollowService) {}

    // Post: follows
    @Post('follows')
    async follow(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Body() dto: CreateFollowDto,
    ) {
        return this.followService.follow(
            user.userId,
            dto.targetId,
            dto.targetType,
        );
    }

    // Delete: follows/:id
    @Delete('follows/:id')
    async unfollow(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') followId: string,
    ) {
        return this.followService.unfollow(followId, user.userId);
    }

    // Get: users/following
    @Get('users/me/following')
    async listFollowing(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Query('cursor') cursor: string,
        @Query('limit') take: number,
    ) {
        return this.followService.listFollowing(user.userId, cursor, take);
    }

    // Get: users/:id/followers
    @Get('users/:id/followers')
    async listUserFollowers(
        @Param('id') targetId: string,
        @Query('cursor') cursor: string,
        @Query('limit') take: number,
    ) {
        return this.followService.listFollowers(targetId, 'USER', cursor, take);
    }

    // Get: organizations/:id/followers
    @Get('orgs/:id/followers')
    async listOrgFollowers(
        @Param('id') targetId: string,
        @Query('cursor') cursor: string,
        @Query('limit') take: number,
    ) {
        return this.followService.listFollowers(
            targetId,
            'ORGANIZATION',
            cursor,
            take,
        );
    }

    // Get: events/:id/followers
    @Get('events/:id/followers')
    async listEventFollowers(
        @Param('id') targetId: string,
        @Query('cursor') cursor: string,
        @Query('limit') take: number,
    ) {
        return this.followService.listFollowers(
            targetId,
            'EVENT',
            cursor,
            take,
        );
    }

    // Get: is following users
    @Get('isFollowing/:followerId/:targetId/user')
    async isFollowingUser(
        @Param('followerId') followerId: string,
        @Param('targetId') targetId: string,
    ) {
        return this.followService.isFollowing(followerId, targetId, 'USER');
    }

    // Get: is following ORGS
    @Get('isFollowing/:followerId/:targetId/org')
    async isFollowingOrg(
        @Param('followerId') followerId: string,
        @Param('targetId') targetId: string,
    ) {
        return this.followService.isFollowing(
            followerId,
            targetId,
            'ORGANIZATION',
        );
    }

    // Get: is following event
    @Get('isFollowing/:followerId/:targetId/event')
    async isFollowingEvent(
        @Param('followerId') followerId: string,
        @Param('targetId') targetId: string,
    ) {
        return this.followService.isFollowing(followerId, targetId, 'EVENT');
    }
}
