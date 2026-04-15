import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PostService } from '../post/post.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class ReactionService {
    constructor(
        private prisma: PrismaService,
        private postService: PostService,
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

    async ownershipCheck(likeId: string, userId: string) {
        const likeRecord = await this.prisma.postLike.findUnique({
            where: { id: likeId },
        });

        if (!likeRecord) throw new NotFoundException('Like record not found');

        if (likeRecord.userId !== userId)
            throw new ForbiddenException('User does not own like record');

        return likeRecord;
    }

    async like(postId: string, userId: string) {
        const post = await this.postService.findById(postId);

        if (!post) throw new NotFoundException('Post not found');

        try {
            return await this.prisma.postLike.create({
                data: {
                    postId: postId,
                    userId: userId,
                },
            });
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
}
