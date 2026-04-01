import { Test, TestingModule } from "@nestjs/testing";
import { OrganizationService } from "./organization.service";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { NotFoundException } from "@nestjs/common";
import { GenerateSlugService } from "../../../common/generate-slug.service";

describe('OrganizationService', () => {
    let service: OrganizationService

    const mockOrg = {
        id: 'id-123',
        name: 'Manila Runners Club',
        slug: 'manila-runners-club',
        description: 'some-description'
    }

    const mockOrgMembership = {
        id: 'id-123',
        userId: 'some-user-id',
        org: 'some-org-id',
    }

    const mockPrisma = {
        organization: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn()
        },
        orgMembership: {
            create: jest.fn()
        },
        $transaction: jest.fn().mockImplementation((callback) => callback(mockPrisma))
    }

    const mockGenerateSlug = {
        generateSlug: jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrganizationService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: GenerateSlugService, useValue: mockGenerateSlug },
            ]
        }).compile();

        service = module.get<OrganizationService>(OrganizationService);
        jest.clearAllMocks();
    });

    // TEST SUITE: create
    describe('create', () => {
        // test: should create org and OWNER membership in transaction
        it('should create org and OWNER membership in transaction', async () => {
            // Arrange
            mockPrisma.organization.create.mockResolvedValue(mockOrg);
            mockPrisma.orgMembership.create.mockResolvedValue(mockOrgMembership);
            mockGenerateSlug.generateSlug.mockReturnValue('manila-runners-club');

            // Act
            const result = await service.create('some-user-id', { name: 'Manila Runners Club', description: 'some-description' });

            // Assert
            expect(mockPrisma.$transaction).toHaveBeenCalled();
            expect(mockPrisma.organization.create).toHaveBeenCalledWith({
                data: { name: 'Manila Runners Club', slug: 'manila-runners-club', description: 'some-description' }
            });
            expect(mockPrisma.orgMembership.create).toHaveBeenCalledWith({
                data: { userId: 'some-user-id', orgId: mockOrg.id, role: 'OWNER' }
            });
            expect(result).toEqual(mockOrg);
        });
    });


    // TEST SUITE: find by slug
    describe('Find by slug', () => {
        // test: should return org when found and not soft-deleted
        it('should return org when found and not soft-deleted', async () => {
            mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
            const result = await service.findBySlug('manila-runners-club');

            expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
                where: {
                    slug: 'manila-runners-club'
                }
            });
            expect(result).toEqual(mockOrg);
        });

        // test: should throw NotFoundException when org not found
        it('should throw NotFoundException when org not found', async () => {
            mockPrisma.organization.findUnique.mockResolvedValue(null);
            await expect(service.findBySlug('manila-runners-club')).rejects.toThrow(NotFoundException);
        });

        // test: should throw NotFoundException when org is soft-deleted
        it('should throw NotFoundException when org is soft-deleted', async () => {
            mockPrisma.organization.findUnique.mockResolvedValue({ ...mockOrg, deletedAt: new Date() });

            await expect(service.findBySlug('manila-runners-club')).rejects.toThrow(NotFoundException);
        });
    });


    // TEST SUITE: find by id
    describe('Find By Id', () => {
        // Test: returns org when found and not soft-deleted
        it('should returns org when found and not soft-deleted', async () => {
            mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
            const result = await service.findById('org-123');

            expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith(
                {
                    where: {
                        id: 'org-123'
                    }
                }
            );
            expect(result).toEqual(mockOrg);
        });

        // Test: throws NotFoundException when not found
        it('should throw NotFoundException when not found', async () => {
            mockPrisma.organization.findUnique.mockResolvedValue(null);

            await expect(service.findById('org-124')).rejects.toThrow(NotFoundException);

            expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith(
                {
                    where: {
                        id: 'org-124'
                    }
                }
            );

        });

        // Test: throws NotFoundException when soft-deleted
        it('should throw NotFoundException when soft-deleted', async () => {
            mockPrisma.organization.findUnique.mockResolvedValue({ ...mockOrg, deletedAt: new Date() });
            await expect(service.findById('org-125')).rejects.toThrow(NotFoundException);
            expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 'org-125'
                }
            })
        });
    });


    // TEST SUITE: exists
    describe('exists', () => {
        // Test: returns true when org exists and not soft-deleted
        it('should return true when org exists and not soft-deleted', async () => {
            mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);
            const result = await service.exists('id-123');
            expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 'id-123'
                }
            });

            expect(result).toBe(true);
        });

        // Test: returns false when org doesn't exist
        it('should return true when org exists and not soft-deleted', async () => {
            mockPrisma.organization.findUnique.mockResolvedValue(null);
            const result = await service.exists('id-123');
            expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 'id-123'
                }
            });

            expect(result).toBe(false);
        });
    });


    // TEST SUITE: update
    describe('update', () => {
        // Test: updates org fields
        it('should update org fields', async () => {
            mockPrisma.organization.update.mockResolvedValue({ ...mockOrg, name: 'New Name' });
            const result = await service.update('id-123', { name: 'New Name' });

            expect(mockPrisma.organization.update).toHaveBeenCalledWith({
                where: {
                    id: 'id-123'
                },
                data: {
                    name: 'New Name'
                }
            });
            expect(result).toEqual({ ...mockOrg, name: 'New Name' });
        });
        //   Hint: mockPrisma.organization.update.mockResolvedValue({ ...mockOrg, name: 'New Name' })
        //   Assert: verify update called with correct where and data
    });


    // TEST SUITE: delete
    describe('delete', () => {
        // Test: soft deletes by setting deletedAt
        it('should soft deletes by setting deletedAt', async () => {
            mockPrisma.organization.update.mockResolvedValue({ ...mockOrg, deletedAt: new Date() });
            const result = await service.delete('id-123');

            expect(mockPrisma.organization.update).toHaveBeenCalledWith({
                where: {
                    id: 'id-123'
                },
                data: {
                    deletedAt: new Date()
                }
            });
            expect(result).toEqual({ ...mockOrg, deletedAt: new Date() })
        });
        //   Assert: verify update called with { data: { deletedAt: expect.any(Date) } }
        //   (NOT prisma.organization.delete — we don't hard delete)
    });


    // TEST SUITE: list
    describe('list', () => {
        // Test: returns orgs without cursor
        it('should return orgs without cursor', async () => {
            mockPrisma.organization.findMany.mockResolvedValue([mockOrg]);
            const result = await service.list();

            expect(mockPrisma.organization.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' }
            });

            expect(result).toEqual({ data: [mockOrg], meta: { cursor: mockOrg.id } });
        });

        // Test: returns orgs with cursor (verify skip: 1 and cursor are set)
        it('should return orgs with cursor (verify skip: 1 and cursor are set)', async () => {
            mockPrisma.organization.findMany.mockResolvedValue([mockOrg]);
            const result = await service.list('cursor');

            expect(mockPrisma.organization.findMany).toHaveBeenCalledWith({
                take: 20,
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                skip: 1,
                cursor: {
                    id: 'cursor'
                }
            });
            expect(result).toEqual({ data: [mockOrg], meta: { cursor: mockOrg.id } });
        });

    })

}); 