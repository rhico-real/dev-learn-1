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
import { CreatePostDto } from './dto/create-post.dto';
import { PostService } from './post.service';
import { take } from 'rxjs';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller()
export class PostController {
    constructor(private service: PostService) {}
    // POST: posts
    // GET posts/:id
    // GET /users/:userId/posts
    // PATCH /posts/:id
    // DELETE /posts/:id

    @Post('posts')
    async create(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Body() dto: CreatePostDto,
    ) {
        return this.service.create(user.userId, dto.content);
    }

    @Get('posts/:id')
    async findById(@Param('id') postId: string) {
        return this.service.findById(postId);
    }

    @Get('users/me/posts')
    async listMyPosts(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Query('cursor') cursor: string,
        @Query('limit') limit: number,
    ) {
        return this.service.listByUser(user.userId, cursor, limit);
    }

    @Get('users/:userId/posts')
    async listByUser(
        @Param('userId') userId: string,
        @Query('cursor') cursor: string,
        @Query('limit') limit: number,
    ) {
        return this.service.listByUser(userId, cursor, limit);
    }

    @Patch('posts/:id')
    async update(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') id: string,
        @Body() dto: UpdatePostDto,
    ) {
        return this.service.update(id, dto.content);
    }

    @Delete('posts/:id')
    async delete(
        @CurrentUser() user: interfaces.AuthenticatedUser,
        @Param('id') id: string,
    ) {
        return this.service.delete(id);
    }
}
