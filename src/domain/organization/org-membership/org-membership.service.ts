import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OrgRole, Prisma } from "@prisma/client";
import { UserService } from "../../identity/user/user.service";
import { PrismaService } from "../../../infrastructure/database/prisma.service";

const ROLE_HIERARCHY: Record<string, number> = {
    MEMBER: 1,
    ADMIN: 2,
    OWNER: 3
}

const roleMap: Record<string, OrgRole> = {
    'ADMIN': OrgRole.ADMIN,
    'MEMBER': OrgRole.MEMBER,
    'OWNER': OrgRole.OWNER
}

@Injectable()
export class OrgMembershipService {
    constructor(private prismaService: PrismaService, private userService: UserService) { }

    async verifyRole(userId: string, orgId: string, minrole: string) {
        const membership = await this.prismaService.orgMembership.findUnique({
            where: {
                userId_orgId: { userId, orgId }
            }
        });

        if (!membership) {
            throw new ForbiddenException('Not a member of this organization.');
        }

        if (ROLE_HIERARCHY[membership.role] < ROLE_HIERARCHY[minrole]) {
            throw new ForbiddenException('Insufficient Role');
        }

        return membership;
    }

    async addMember(orgId: string, userId: string, role: string) {
        // check if user exists first
        const userExists = await this.userService.findById(userId);

        // if not exists -> NotFoundException
        if (!userExists) {
            throw new NotFoundException('User not found');
        }

        // create membership
        try {
            return await this.prismaService.orgMembership.create({
                data: {
                    userId: userId,
                    orgId: orgId,
                    role: roleMap[role.toUpperCase()]
                }
            });
        } catch (e) {
            if ((e instanceof Prisma.PrismaClientKnownRequestError) && e.code === 'P2002') {
                throw new ConflictException('User already a member')
            }

            throw e;
        }
    }

    async removeMember(orgId: string, userId: string) {
        // look up membership first to check role
        try {
            const membershipRole = await this.prismaService.orgMembership.findUnique({
                where: {
                    userId_orgId: { userId, orgId }
                },
                select: { role: true }
            });

            // if owner -> throw ForbiddenException cannot remove organization owner
            if (membershipRole?.role === OrgRole.OWNER) {
                throw new ForbiddenException('Cannot remove organization owner.');
            }

            // if not -> delete membership
            return await this.prismaService.orgMembership.delete({
                where: {
                    userId_orgId: { userId, orgId }
                }
            });
        } catch (e) {
            if ((e instanceof Prisma.PrismaClientKnownRequestError) && e.code === 'P2025') {
                throw new NotFoundException('Record not found');
            }

            throw e;
        }

    }

    async updateRole(orgId: string, userId: string, newRole: string) {
        // update role
        // only an owner should be able to call this
        return await this.prismaService.orgMembership.update({
            where: {
                userId_orgId: { userId, orgId }
            },
            data: {
                role: roleMap[newRole.toUpperCase()]
            }
        })

    }

    async listMembers(orgId: string) {
        // returns all memberships for an org
        // WITH USER INFO INCLUDED
        return await this.prismaService.orgMembership.findMany({
            where: {
                orgId: orgId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        displayName: true,
                        avatar: true
                    }
                }
            }
        });
    }

    async findByUserAndOrg(userId: string, orgId: string) {
        // returns a membership or null
        // returns if SOMEONE is a member
        return await this.prismaService.orgMembership.findUnique({
            where: {
                userId_orgId: { userId, orgId }
            }
        });
    }
}