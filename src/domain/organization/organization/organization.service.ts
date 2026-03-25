import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { PrismaService } from "src/infrastructure/database/prisma.service";

@Injectable()
export class OrganizationService {
    constructor(private prisma: PrismaService) { }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
    }

    async create(userId: string, dto: CreateOrganizationDto) {
        const slug = this.generateSlug(dto.name);

        return this.prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: dto.name,
                    slug,
                    description: dto.description
                }
            });

            await tx.orgMembership.create({
                data: {
                    userId,
                    orgId: org.id,
                    role: 'OWNER'
                }
            });

            return org;
        });
    }

    async list(cursor?: string, take: number = 20) {
        const args: Prisma.OrganizationFindManyArgs = {
            take,
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' }
        };

        if (cursor) {
            args.skip = 1;
            args.cursor = { id: cursor }
        }

        return this.prisma.organization.findMany(args);
    }

    // find by slug
    async findBySlug(slug: string) {
        const org = await this.prisma.organization.findUnique({
            where: {
                slug: slug
            }
        });

        if (!org || org.deletedAt) throw new NotFoundException('Organization not found');

        return org;
    }

    // find by ID
    async findById(id: string) {
        const org = await this.prisma.organization.findUnique({
            where: {
                id: id
            }
        });

        if (!org || org.deletedAt) throw new NotFoundException('Organization not found');

        return org;
    }

    // exists
    async exists(id: string) {
        const org = await this.prisma.organization.findUnique({
            where: {
                id: id
            }
        });

        if (org?.deletedAt) {
            return false;
        }

        return !!org;
    }

    // update
    async update(id: string, dto: UpdateOrganizationDto) {
        return await this.prisma.organization.update({
            where: { id },
            data: dto
        });
    }

    // delete -> soft delete
    async delete(id: string) {
        return await this.prisma.organization.update({
            where: { id },
            data: {
                deletedAt: new Date()
            }
        })
    }
}