import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    private excludePassword(user: any) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async create(data: any) {
        const passwordHash = await bcrypt.hash(data.password, 12);

        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                password: passwordHash,
                displayName: data.displayName
            }
        });

        return this.excludePassword(user);
    }

    async findByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                email,
                deletedAt: null
            }
        });

        return user;
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id,
                deletedAt: null
            }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.excludePassword(user);
    }

    async exists(id: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id,
                deletedAt: null
            },
            select: {
                id: true
            }
        });

        return !!user;
    }

    async update(id: string, data: any) {
        const user = await this.prisma.user.update({
            where: {
                id
            }, data
        });

        return this.excludePassword(user);
    }
}