import { Test, TestingModule } from '@nestjs/testing';
import { OrgMembershipService } from './org-membership.service';
import {
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { UserService } from '../../identity/user/user.service';
import { OrgRole, Prisma } from '@prisma/client';

describe('OrgMembershipService', () => {
    let service: OrgMembershipService;

    const mockMembership = {
        id: 'membership-id',
        userId: 'some-user-id',
        orgId: 'some-org-id',
        role: 'OWNER',
        joinedAt: new Date(),
    };

    const mockUser = {
        id: '123',
        email: 'test@test.com',
        displayName: 'Test User',
        avatar: null,
    };

    const mockPrisma = {
        orgMembership: {
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
        },
    };

    const mockUserService = {
        findById: jest.fn(),
    };

    const roleMap: Record<string, OrgRole> = {
        ADMIN: OrgRole.ADMIN,
        MEMBER: OrgRole.MEMBER,
        OWNER: OrgRole.OWNER,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrgMembershipService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: UserService, useValue: mockUserService },
            ],
        }).compile();

        service = module.get<OrgMembershipService>(OrgMembershipService);
        jest.resetAllMocks();
    });

    // TEST SUITE: verifyRole
    describe('verifyRole', () => {
        // test: return membership
        it('should return membership after verifying role', async () => {
            // Arrange
            mockPrisma.orgMembership.findUnique.mockResolvedValue(
                mockMembership,
            );

            // Act
            const result = await service.verifyRole(
                'some-user-id',
                'some-org-id',
                'MEMBER',
            );

            // Assert
            expect(result).toEqual(mockMembership);
            expect(mockPrisma.orgMembership.findUnique).toHaveBeenCalledWith({
                where: {
                    userId_orgId: {
                        userId: 'some-user-id',
                        orgId: 'some-org-id',
                    },
                },
            });
        });

        // test: return ForbiddenException if not a member
        it('should return ForbiddenException if not a member', async () => {
            // Arrange
            mockPrisma.orgMembership.findUnique.mockResolvedValue(null);

            // Act and Assert
            await expect(
                service.verifyRole('some-user-id', 'some-org-id', 'MEMBER'),
            ).rejects.toThrow(ForbiddenException);
        });

        // test: return ForbiddenException if insufficient role
        it('should return ForbiddenException if role is insufficient', async () => {
            // Arrange
            mockPrisma.orgMembership.findUnique.mockResolvedValue({
                ...mockMembership,
                role: 'MEMBER',
            });

            // Act and Assert
            await expect(
                service.verifyRole('some-user-id', 'some-org-id', 'ADMIN'),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // TEST SUITE: addMember
    describe('addMember', () => {
        // test: return membership
        it('should return membership', async () => {
            // Arrange
            mockUserService.findById.mockResolvedValue(mockUser);
            mockPrisma.orgMembership.create.mockResolvedValue(mockMembership);

            // Act
            const result = await service.addMember(
                'some-org-id',
                'some-user-id',
                'OWNER',
            );

            // Assert
            expect(result).toBe(mockMembership);
            expect(mockUserService.findById).toHaveBeenCalledWith(
                'some-user-id',
            );
        });

        // test: return NotFoundException user not found
        it('should return NotFoundException if user is not found', async () => {
            // Arrange
            mockUserService.findById.mockResolvedValue(null);

            // Act and Assert
            await expect(
                service.addMember('some-org-id', 'some-user-id', 'OWNER'),
            ).rejects.toThrow(NotFoundException);
        });

        // test: return ConflictException user already a member
        it('should return ConflictException is user is already a member', async () => {
            // Arrange
            mockUserService.findById.mockResolvedValue(mockUser);

            const prismaError = new Prisma.PrismaClientKnownRequestError(
                'Unique constraint failed on the fields: (userId, orgId)',
                { code: 'P2002', clientVersion: '5.0.0' },
            );

            mockPrisma.orgMembership.create.mockRejectedValue(prismaError);

            // Act and Assert
            await expect(
                service.addMember('some-org-id', 'some-user-id', 'OWNER'),
            ).rejects.toThrow(ConflictException);
        });
    });

    // TEST SUITE: removeMember
    describe('removeMember', () => {
        // test: return membership
        it('should return membership', async () => {
            // Arrange
            mockPrisma.orgMembership.findUnique.mockResolvedValue({
                role: 'MEMBER',
            });
            mockPrisma.orgMembership.delete.mockResolvedValue(mockMembership);

            // Act
            const result = await service.removeMember(
                'some-org-id',
                'some-user-id',
            );

            // Assert
            expect(result).toBe(mockMembership);
        });

        // test: return ForbiddenException if user is owner. Cannot remove owner.
        it('should return ForbiddenException if user is owner. Cannot remove owner.', async () => {
            // Arrange
            mockPrisma.orgMembership.findUnique.mockResolvedValue({
                role: 'OWNER',
            });

            // Act and Assert
            await expect(
                service.removeMember('some-org-id', 'some-user-id'),
            ).rejects.toThrow(ForbiddenException);
        });

        // test: return NotFoundException record not found if already deleted
        it('should return NotFoundException if already deleted', async () => {
            // Arrange
            mockPrisma.orgMembership.findUnique.mockResolvedValue({
                role: 'MEMBER',
            });

            const prismaError = new Prisma.PrismaClientKnownRequestError(
                'An operation failed because it depends on one or more records that were required but not found.',
                {
                    code: 'P2025',
                    clientVersion: '5.0.0',
                },
            );

            mockPrisma.orgMembership.delete.mockRejectedValue(prismaError);

            // Act and Assert
            await expect(
                service.removeMember('some-org-id', 'some-user-id'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // TEST SUITE: updateRole
    describe('updateRole', () => {
        // test: return membership
        it('should return membership', async () => {
            mockPrisma.orgMembership.update.mockResolvedValue(mockMembership);
            const result = await service.updateRole(
                'some-org-id',
                'some-user-id',
                'ADMIN',
            );

            expect(result).toBe(mockMembership);
            expect(mockPrisma.orgMembership.update).toHaveBeenCalledWith({
                where: {
                    userId_orgId: {
                        userId: 'some-user-id',
                        orgId: 'some-org-id',
                    },
                },
                data: {
                    role: roleMap['ADMIN'],
                },
            });
        });
    });

    // TEST SUITE: listMembers
    describe('listMembers', () => {
        // test: return membership
        // test: return membership with user info included
        it('should return membership', async () => {
            mockPrisma.orgMembership.findMany.mockResolvedValue([
                { ...mockMembership, ...mockUser },
            ]);
            const result = await service.listMembers('some-org-id');

            expect(result[0]).toHaveProperty('email');
            expect(result[0]).toHaveProperty('displayName');
            expect(result[0]).toHaveProperty('avatar');

            expect(mockPrisma.orgMembership.findMany).toHaveBeenCalledWith({
                where: {
                    orgId: 'some-org-id',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            displayName: true,
                            avatar: true,
                        },
                    },
                },
            });
        });
    });

    describe('findUserAndOrg', () => {
        // test: return if user is a member
        it('should return if user is a member', async () => {
            mockPrisma.orgMembership.findUnique.mockResolvedValue(
                mockMembership,
            );
            const result = await service.findByUserAndOrg(
                'some-user-id',
                'some-org-id',
            );

            expect(result).toEqual(mockMembership);
            expect(mockPrisma.orgMembership.findUnique).toHaveBeenCalledWith({
                where: {
                    userId_orgId: {
                        userId: 'some-user-id',
                        orgId: 'some-org-id',
                    },
                },
            });
        });
    });
});
