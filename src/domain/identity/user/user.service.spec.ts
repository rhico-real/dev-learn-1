import { ExecutionContext } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "src/infrastructure/database/prisma.service"

describe('UserService', () => {
    let service: UserService;

    const mockPrisma = {
        user: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            count: jest.fn()
        }
    }

    beforeEach( async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: PrismaService,
                    useValue: mockPrisma
                }
            ]
        }).compile();

        service = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should find user by email', async () => {
        // Arrange
        const mockUser = {id: 1, email: 'test@test.com'};
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        // Act
        const result = await service.findByEmail('test@test.com');

        // Assert
        expect(result).toEqual(mockUser);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
            where: {email: 'test@test.com'}
        })
    })
})