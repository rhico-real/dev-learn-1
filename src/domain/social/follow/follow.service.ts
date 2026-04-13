import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, TargetType } from '@prisma/client';
import { UserService } from '../../identity/user/user.service';
import { OrganizationService } from '../../organization/organization/organization.service';
import { EventService } from '../../event/event/event.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

const targetTypeMap: Record<string, TargetType> = {
    USER: TargetType.USER,
    ORGANIZATION: TargetType.ORGANIZATION,
    EVENT: TargetType.EVENT,
};

@Injectable()
export class FollowService {
    constructor(
        private prismaService: PrismaService,
        private userService: UserService,
        private orgService: OrganizationService,
        private eventService: EventService,
    ) {}

    /**
     * private: validateTargetExists
     * Basically, you can follow:
     * - user
     * - org
     * - event
     */

    private async validateTargetExists(
        targetId: string,
        targetType: TargetType,
    ): Promise<void> {
        let exists: boolean;

        switch (targetType) {
            case TargetType.USER:
                exists = await this.userService.exists(targetId);
                break;
            case TargetType.ORGANIZATION:
                exists = await this.orgService.exists(targetId);
                break;
            case TargetType.EVENT:
                exists = await this.eventService.exists(targetId);
                break;
            default:
                throw new BadRequestException(
                    `Invalid target type: ${targetType}`,
                );
        }

        if (!exists) {
            throw new NotFoundException(`${targetType} not found.`);
        }
    }

    /**
     * Follow
     * Params: followerId, targetId, targetType
     * - Self follow prevention
     * - vaidate target exists
     * - Create a follow record. Catch P2002 and throw new ConflictException if already followed.
     */
    async follow(followerId: string, targetId: string, targetType: string) {
        if (targetType === 'USER' && followerId === targetId) {
            throw new BadRequestException('Invalid follow.');
        }

        if (!(targetType in targetTypeMap)) {
            throw new BadRequestException('Invalid target type');
        }

        await this.validateTargetExists(targetId, targetTypeMap[targetType]);

        try {
            return await this.prismaService.follow.create({
                data: {
                    followerId: followerId,
                    targetId: targetId,
                    targetType: targetTypeMap[targetType],
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('Follow record already created.');
            }

            throw error;
        }
    }

    /**
     * Unfollow
     * Params: followId, userId
     * - Find follow record
     * - Verify ownership
     * - Delete record
     */

    async unfollow(followId: string, userId: string) {
        const res = await this.prismaService.follow.findUnique({
            where: { id: followId },
        });

        if (!res) {
            throw new NotFoundException('Follow record not found.');
        }

        if (userId !== res.followerId) {
            throw new ForbiddenException(
                'You can only unfollow your own record.',
            );
        }

        return this.prismaService.follow.delete({
            where: { id: followId },
        });
    }

    /**
     * listFollowing (what I follow)
     * Params: userId, cursor?, take?
     */

    async listFollowing(userId: string, cursor?: string, take: number = 20) {
        const args: Prisma.FollowFindManyArgs = {
            take,
            where: { followerId: userId },
            orderBy: { createdAt: 'asc' },
        };

        if (cursor) {
            args.skip = 1;
            args.cursor = { id: cursor };
        }

        const follow = await this.prismaService.follow.findMany(args);
        const nextCursor = follow.at(-1)?.id;

        return {
            data: follow,
            meta: {
                cursor: nextCursor,
            },
        };
    }

    /**
     * listFollowers (not just on mine but others as well)
     * Params: targetId, targetType, cursor?, take?
     */

    async listFollowers(
        targetId: string,
        targetType: string,
        cursor?: string,
        take: number = 20,
    ) {
        const args: Prisma.FollowFindManyArgs = {
            take,
            where: {
                targetId: targetId,
                targetType: targetTypeMap[targetType],
            },
            orderBy: { createdAt: 'asc' },
        };

        if (cursor) {
            args.skip = 1;
            args.cursor = { id: cursor };
        }

        const follow = await this.prismaService.follow.findMany(args);
        const nextCursor = follow.at(-1)?.id;

        return {
            data: follow,
            meta: {
                cursor: nextCursor,
            },
        };
    }

    /**
     * isFollowing
     * Params: followerId, targetId, targetType
     */

    async isFollowing(
        followerId: string,
        targetId: string,
        targetType: string,
    ) {
        const follow = await this.prismaService.follow.findUnique({
            where: {
                followerId_targetId_targetType: {
                    followerId: followerId,
                    targetId: targetId,
                    targetType: targetTypeMap[targetType],
                },
            },
        });

        return !!follow;
    }
}
