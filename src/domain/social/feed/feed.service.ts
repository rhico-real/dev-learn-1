import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PostService } from '../post/post.service';
import { FollowService } from '../follow/follow.service';
import { Prisma, TargetType } from '@prisma/client';

@Injectable()
export class FeedService {
    constructor(private prisma: PrismaService) {}

    private async reactionExists(postId: string, userId: string) {
        const res = await this.prisma.postLike.findUnique({
            where: {
                postId_userId: { postId: postId, userId: userId },
            },
        });

        return !!res;
    }

    async listFeed(userId: string, cursor?: string, take: number = 20) {
        // query all then just extract the targetId's
        const following = await this.prisma.follow.findMany({
            where: { followerId: userId, targetType: TargetType.USER },
            select: { targetId: true },
        });

        const args = ({
            targetId,
            take,
            cursor,
        }: {
            targetId: string;
            take: number;
            cursor?: string;
        }) => ({
            take: take,
            where: { authorId: targetId, deletedAt: null },
            include: {
                author: {
                    select: { id: true, displayName: true, avatar: true },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
            orderBy: [
                {
                    createdAt: Prisma.SortOrder.desc,
                },
                { id: Prisma.SortOrder.asc },
            ],
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        });

        const res = (
            await Promise.all(
                following.map(async (element) => {
                    const post = await this.prisma.post.findMany(
                        args({
                            targetId: element.targetId,
                            take: take,
                            cursor: cursor,
                        }),
                    );

                    return post;
                }),
            )
        ).flat();

        const newPosts = await Promise.all(
            res.map(async (element) => {
                const { _count, ...rest } = element;

                const post = {
                    ...rest,
                    counts: {
                        likes: _count.likes,
                        comments: _count.comments,
                    },
                    likedByMe: await this.reactionExists(element.id, userId),
                };
                return post;
            }),
        );

        const nextCursor = newPosts.at(-1)?.id;

        return {
            data: newPosts,
            meta: {
                cursor: nextCursor,
            },
        };
    }
}
