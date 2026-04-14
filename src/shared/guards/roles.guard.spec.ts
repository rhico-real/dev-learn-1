import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ExecutionContext } from '@nestjs/common';
import { SystemRole } from '../types/enums';

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new RolesGuard(reflector);
    });

    const createMockContext = (
        userRole?: SystemRole,
        requiredRoles?: SystemRole[],
    ): ExecutionContext => {
        // 1. Mock the Reflector return value
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(
            requiredRoles,
        );

        // 2. Mock the Request object with a user
        return {
            getHandler: () => ({}),
            getClass: () => ({}),
            switchToHttp: () => ({
                getRequest: () => ({
                    user: userRole ? { role: userRole } : undefined,
                }),
            }),
        } as unknown as ExecutionContext;
    };

    it('should return true if no roles are required (@Roles not present)', async () => {
        const context = createMockContext(SystemRole.USER, undefined);
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
    });

    it('should return true if user role matches required role', async () => {
        const context = createMockContext(SystemRole.SUPER_ADMIN, [
            SystemRole.SUPER_ADMIN,
        ]);
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
    });

    it('should return false if user role does NOT match required role', async () => {
        const context = createMockContext(SystemRole.USER, [
            SystemRole.SUPER_ADMIN,
        ]);
        const result = await guard.canActivate(context);
        expect(result).toBe(false);
    });

    it('should return true if user is SUPER_ADMIN (the "God Mode" bypass)', async () => {
        // Required role is USER, but user is SUPER_ADMIN
        const context = createMockContext(SystemRole.SUPER_ADMIN, [
            SystemRole.USER,
        ]);
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
    });
});
