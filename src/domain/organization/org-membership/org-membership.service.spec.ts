import { Test, TestingModule } from "@nestjs/testing";
import { OrgMembershipService } from "./org-membership.service";
import { ForbiddenException } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma.service";
import { UserService } from "src/domain/identity/user/user.service";

describe('OrgMembershipService', () => {
    let service: OrgMembershipService;

    const mockMembership = {
        id: 'membership-id',
        userId: 'some-user-id',
        orgId: 'some-org-id',
        role: 'OWNER',
        joinedAt: new Date()
    };

    const mockPrisma = {
        orgMembership: {
            findUnique: jest.fn()
        }
    }

    const mockUser = {}

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrgMembershipService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: UserService, useValue: mockUser }
            ],
        }).compile();

        service = module.get<OrgMembershipService>(OrgMembershipService);
        jest.clearAllMocks();
    });

    // TEST SUITE: verifyRole
    describe('verifyRole', () => {
        // test: return membership
        it('should return membership after verifying role', async () => {
            // Arrange
            mockPrisma.orgMembership.findUnique.mockResolvedValue(mockMembership);

            // Act
            const result = await service.verifyRole('some-user-id', 'some-org-id', 'MEMBER');

            // Assert
            expect(result).toBe(mockMembership);
        });

        // test: return ForbiddenException if not a member
        it('should return ForbiddenException if not a member', async () => {
            // Arrange
            mockPrisma.orgMembership.findUnique.mockResolvedValue(null);

            // Act and Assert
            await expect(service.verifyRole('some-user-id', 'some-org-id', 'MEMBER')).rejects.toThrow(ForbiddenException);
        });


        // test: return ForbiddenException if insufficient role
        it('should return ForbiddenException if not a member', async () => {
            // Arrange
            mockPrisma.orgMembership.findUnique.mockResolvedValue({ ...mockMembership, role: 'MEMBER' });

            // Act and Assert
            await expect(service.verifyRole('some-user-id', 'some-org-id', 'ADMIN')).rejects.toThrow(ForbiddenException);
        });
    });


    // TEST SUITE: addMember
    describe('addMember', () => {
        // test: return membership
        it('should return membership', async () => {
            // Arrange
            mockPr
            // Act
            // Assert
        })
        // test: return NotFoundException user not found
        // test: return ConflictException user already a member
    });


    // TEST SUITE: removeMember
    // test: return membership
    // test: return ForbiddenException if user is owner. Cannot remove owner.
    // test: return NotFoundException record not found if already deleted

    // TEST SUITE: updateRole
    // test: return membership

    // TEST SUITE: listMembers
    // test: return membership with user info included
});