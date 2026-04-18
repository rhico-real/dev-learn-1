import { Test, TestingModule } from '@nestjs/testing';
import { FollowService } from './follow.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { UserService } from '../../identity/user/user.service';
import { OrganizationService } from '../../organization/organization/organization.service';
import { EventService } from '../../event/event/event.service';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, TargetType } from '@prisma/client';

describe('Follow Service', () => {
    let service: FollowService;

    const mockPrisma = {
        follow: {
            create: jest.fn(),
            findUnique: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
    };

    const mockFollowUser = {
        id: 'follow-id-123',
        followerId: 'follower-id-123',
        targetId: 'target-id-123',
        targetType: 'USER',
        createdAt: new Date('2026-04-11'),
    };

    const mockFollowOrg = {
        id: 'follow-org-id-123',
        followerId: 'follower-org-id-123',
        targetId: 'target-org-id-123',
        targetType: 'ORGANIZATION',
        createdAt: new Date('2026-04-11'),
    };

    const mockFollowEvent = {
        id: 'follow-event-id-123',
        followerId: 'follower-event-id-123',
        targetId: 'target-event-id-123',
        targetType: 'EVENT',
        createdAt: new Date('2026-04-11'),
    };

    const mockUserService = {
        exists: jest.fn(),
    };

    const mockOrgService = {
        exists: jest.fn(),
    };

    const mockEventService = {
        exists: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FollowService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: UserService, useValue: mockUserService },
                { provide: OrganizationService, useValue: mockOrgService },
                { provide: EventService, useValue: mockEventService },
            ],
        }).compile();

        service = module.get<FollowService>(FollowService);
        jest.resetAllMocks();
    });

    /**
     * follow
     * - Create follow record
     * - throw BadRequestException if following yourself
     * - throw BadRequestException if target type is invalid (USER, ORGANIZATION, EVENT)
     * - throw ConflictException if P2002
     */
    describe('follow', () => {
        describe('follow happy path', () => {
            it('should create a follow record for USER', async () => {
                mockPrisma.follow.create.mockResolvedValue(mockFollowUser);
                mockUserService.exists.mockResolvedValue(true);

                const result = await service.follow(
                    'follower-id-123',
                    'target-id-123',
                    'USER',
                );
                expect(result).toEqual(mockFollowUser);
            });

            it('should create a follow record for ORGANIZATION', async () => {
                mockPrisma.follow.create.mockResolvedValue(mockFollowOrg);
                mockOrgService.exists.mockResolvedValue(true);

                const result = await service.follow(
                    'follower-org-id-123',
                    'target-org-id-123',
                    'ORGANIZATION',
                );
                expect(result).toEqual(mockFollowOrg);
            });

            it('should create a follow record for EVENT', async () => {
                mockPrisma.follow.create.mockResolvedValue(mockFollowEvent);
                mockEventService.exists.mockResolvedValue(true);

                const result = await service.follow(
                    'follower-event-id-123',
                    'target-event-id-123',
                    'EVENT',
                );
                expect(result).toEqual(mockFollowEvent);
            });
        });

        describe('follow unhappy Paths', () => {
            it('should return BadRequestException if following yourself', async () => {
                await expect(
                    service.follow(
                        'follower-id-123',
                        'follower-id-123',
                        'USER',
                    ),
                ).rejects.toThrow(BadRequestException);
            });

            it('should throw BadRequestException if target type is invalid', async () => {
                await expect(
                    service.follow(
                        'follower-id-123',
                        'target-id-123',
                        'invalidTargetType',
                    ),
                ).rejects.toThrow(BadRequestException);
            });

            it('should throw ConflictException if P2002', async () => {
                const prismaError = new Prisma.PrismaClientKnownRequestError(
                    'Unique constraint failed on the fields: (userId, orgId)',
                    { code: 'P2002', clientVersion: '5.0.0' },
                );

                mockPrisma.follow.create.mockRejectedValue(prismaError);
                mockUserService.exists.mockResolvedValue(true);

                expect(
                    service.follow('follower-id-123', 'target-id-123', 'USER'),
                ).rejects.toThrow(ConflictException);
            });
        });
    });

    /**
     * unfollow
     * - delete follow record
     * - throw NotFoundException if follow is not found
     * - throw ForbiddenException if tried to unfollow not your record
     */
    describe('unfollow', () => {
        describe('unfollow happy paths', () => {
            // be able to delete follow record
            it('should be able to delete follow record', async () => {
                mockPrisma.follow.findUnique.mockResolvedValue(mockFollowUser);
                mockPrisma.follow.delete.mockResolvedValue(mockFollowUser);

                const result = await service.unfollow(
                    'follow-id-123',
                    'follower-id-123',
                );

                expect(mockPrisma.follow.delete).toHaveBeenCalledWith({
                    where: { id: 'follow-id-123' },
                });
                expect(result).toEqual(mockFollowUser);
            });
        });

        describe('unfollow unhappy paths', () => {
            it('should throw NotFoundException if follow is not found', async () => {
                mockPrisma.follow.findUnique.mockResolvedValue(null);

                await expect(
                    service.unfollow('follow-null-id-123', 'follower-id-123'),
                ).rejects.toThrow(NotFoundException);
            });

            it('should throw ForbiddenException if tried to unfollow not your record', async () => {
                mockPrisma.follow.findUnique.mockResolvedValue(mockFollowUser);

                await expect(
                    service.unfollow('follow-id-123', 'follower-not-id-123'),
                ).rejects.toThrow(ForbiddenException);
            });
        });
    });

    /**
     * listFollowing
     */
    describe('listfollowing', () => {
        it('should return list of your followers', async () => {
            mockPrisma.follow.findMany.mockResolvedValue([mockFollowUser]);
            const result = await service.listFollowing('follower-id-123');

            expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { followerId: 'follower-id-123' },
                orderBy: { createdAt: 'asc' },
            });

            expect(result).toEqual({
                data: [mockFollowUser],
                meta: {
                    cursor: 'follow-id-123',
                },
            });
        });
    });

    /**
     * listFollowers
     */
    describe('listfollowers', () => {
        it('should return list of followers of target', async () => {
            mockPrisma.follow.findMany.mockResolvedValue([mockFollowUser]);
            const result = await service.listFollowers('target-id-123', 'USER');

            expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
                take: 20,
                where: {
                    targetId: 'target-id-123',
                    targetType: TargetType.USER,
                },
                orderBy: { createdAt: 'asc' },
            });

            expect(result).toEqual({
                data: [mockFollowUser],
                meta: {
                    cursor: 'follow-id-123',
                },
            });
        });
    });

    /**
     * isFollowing
     * - return true if found
     * - return false if not found
     */
    describe('isFollowing', () => {
        it('should return true if follow is found', async () => {
            mockPrisma.follow.findUnique.mockResolvedValue(mockFollowUser);
            const result = await service.isFollowing(
                'follower-id-123',
                'target-id-123',
                'USER',
            );
            expect(result).toBe(true);
        });

        it('should return false if follow is not found', async () => {
            mockPrisma.follow.findUnique.mockResolvedValue(null);
            const result = await service.isFollowing(
                'follower-null-id-123',
                'target-null-id-123',
                'USER',
            );

            expect(result).toBe(false);
        });
    });
});
