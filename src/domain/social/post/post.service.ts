import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostService {
    constructor(private prisma: PrismaService) {}

    async findById(postId: string) {
        return this.prisma.post.findUnique({
            where: { id: postId },
        });
    }

    async ownershipCheck(userId: string, postId: string) {
        const post = await this.findById(postId);

        if (!post) throw new NotFoundException('Post not found');

        if (post.authorId !== userId)
            throw new ForbiddenException('Not allowed to modify post.');

        return post;
    }

    async exists(postId: string) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        return !!post;
    }

    /**
     * Create post
     * - reject empty content
     */
    async create(author: string, content: string) {
        if (!content || content.length === 0) {
            throw new BadRequestException('Content cannot be empty.');
        }

        return this.prisma.post.create({
            data: {
                authorId: author,
                content: content,
            },
        });
    }

    /**
     * Update own post
     * - block updating someone else's post
     */
    async update(postId: string, content?: string) {
        const post = await this.findById(postId);

        if (!post) throw new NotFoundException('Post not found');

        return this.prisma.post.update({
            where: {
                id: postId,
            },
            data: {
                content: content,
            },
        });
    }

    // soft-delete own post
    async delete(postId: string) {
        const post = await this.findById(postId);

        if (!post) throw new NotFoundException('Post not found');

        return this.prisma.post.update({
            where: {
                id: postId,
            },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    // hide deleted posts from normal reads
    async listByUser(userId: string, cursor?: string, take: number = 20) {
        const args: Prisma.PostFindManyArgs = {
            take,
            where: { authorId: userId, deletedAt: null },
            orderBy: { createdAt: 'asc' },
        };

        if (cursor) {
            args.skip = 1;
            args.cursor = { id: cursor };
        }

        const posts = await this.prisma.post.findMany(args);
        const nextCursor = posts.at(-1)?.id;

        return {
            data: posts,
            meta: {
                cursor: nextCursor,
            },
        };
    }
}
