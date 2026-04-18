import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PostService } from '../post/post.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEventTypes } from '../notification/notification-events';

@Injectable()
export class ReactionService {
    constructor(
        private prisma: PrismaService,
        private postService: PostService,
        private eventEmitter: EventEmitter2,
    ) {}
    /**
     * Like a post
     * - liking a missing post return NotFoundException
     * - duplicate likes do not create duplicate rows
     */
    /**
     * Unlike a post
     * - removes a like
     * - user can only unlike their own like relation'
     */

    async ownershipLikeCheck(likeId: string, userId: string) {
        const likeRecord = await this.prisma.postLike.findUnique({
            where: { id: likeId },
        });

        if (!likeRecord) throw new NotFoundException('Like record not found');

        if (likeRecord.userId !== userId)
            throw new ForbiddenException('User does not own like record');

        return likeRecord;
    }

    async ownershipCommentCheck(commentId: string, userId: string) {
        const commentRecord = await this.prisma.postComment.findUnique({
            where: { id: commentId },
        });

        if (!commentRecord) throw new NotFoundException('Comment not found');

        if (commentRecord.authorId !== userId)
            throw new ForbiddenException('User does not own comment');

        return commentRecord;
    }

    async like(postId: string, userId: string) {
        const post = await this.postService.findById(postId);

        if (!post) throw new NotFoundException('Post not found');

        try {
            const like = await this.prisma.postLike.create({
                data: {
                    postId: postId,
                    userId: userId,
                },
            });

            this.eventEmitter.emit(NotificationEventTypes.POST_LIKE, {
                actorId: userId,
                postId,
            });

            return like;
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('Duplicate like');
            }

            throw error;
        }
    }

    async unlike(likeId: string) {
        try {
            return await this.prisma.postLike.delete({
                where: { id: likeId },
            });
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundException('Like record does not exist');
            }

            throw error;
        }
    }

    async createComment(postId: string, userId: string, dto: CreateCommentDto) {
        // create comment on existing post
        // reject comment on deleted or missing post

        const post = await this.postService.exists(postId);

        if (!post) throw new NotFoundException('Post not found');

        const comment = await this.prisma.postComment.create({
            data: {
                postId: postId,
                authorId: userId,
                content: dto.content,
            },
        });

        this.eventEmitter.emit(NotificationEventTypes.POST_COMMENT, {
            actorId: userId,
            postId,
            commentId: comment.id,
        });

        return comment;
    }

    async listComments(postId: string, cursor?: string, take: number = 20) {
        const args: Prisma.PostCommentFindManyArgs = {
            take,
            where: { postId: postId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        };

        if (cursor) {
            args.skip = 1;
            args.cursor = { id: cursor };
        }

        const comments = await this.prisma.postComment.findMany(args);
        const nextCursor = comments.at(-1)?.id;

        return {
            data: comments,
            meta: {
                cursor: nextCursor,
            },
        };
    }

    async updateComment(
        commentId: string,
        userId: string,
        dto: UpdateCommentDto,
    ) {
        try {
            return await this.prisma.postComment.update({
                where: {
                    id: commentId,
                    authorId: userId,
                },
                data: {
                    content: dto.content,
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundException('Comment not found');
            }
        }
    }

    async removeComment(commentId: string, userId: string) {
        try {
            return await this.prisma.postComment.update({
                where: {
                    id: commentId,
                    authorId: userId,
                },
                data: {
                    deletedAt: new Date(),
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundException('Comment not found');
            }
        }
    }
}
