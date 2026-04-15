import { Controller, Delete, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import * as interfaces from '../../../shared/types/interfaces';
import { ReactionService } from './reaction.service';

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
        await this.reactionService.ownershipCheck(likeId, user.userId);
        return this.reactionService.unlike(likeId);
    }
}
