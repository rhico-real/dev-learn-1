import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import * as interfaces from '../../../shared/types/interfaces';
import { ReactionService } from './reaction.service';
import { PaginationQueryDTO } from '../../../shared/dto/pagination-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('posts')
export class ReactionController {
    constructor(private reactionService: ReactionService) {}

    @Post(':id/likes')
    async like(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') postId: string,
    ) {
        return this.reactionService.like(postId, user.userId);
    }

    @Delete(':id/likes')
    async unlike(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') likeId: string,
    ) {
        await this.reactionService.ownershipLikeCheck(likeId, user.userId);
        return this.reactionService.unlike(likeId);
    }

    @Get(':id/comments')
    async listComments(
        @Param('id') postId: string,
        @Query() dto: PaginationQueryDTO,
    ) {
        return this.reactionService.listComments(postId, dto.cursor, dto.limit);
    }

    @Post(':id/comments')
    async createComment(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') postId: string,
        @Body() dto: CreateCommentDto,
    ) {
        return this.reactionService.createComment(postId, user.userId, dto);
    }

    @Patch('comments/:id')
    async updateComment(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') commentId: string,
        @Body() dto: UpdateCommentDto,
    ) {
        await this.reactionService.ownershipCommentCheck(
            commentId,
            user.userId,
        );
        return this.reactionService.updateComment(commentId, user.userId, dto);
    }

    @Delete('comments/:id')
    async removeComment(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') commentId: string,
    ) {
        await this.reactionService.ownershipCommentCheck(
            commentId,
            user.userId,
        );
        return this.reactionService.removeComment(commentId, user.userId);
    }
}
