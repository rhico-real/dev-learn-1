import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let reflector: Reflector;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new JwtAuthGuard(reflector);
    });

    // Mocking the ExecutionContext helper
    const createMockContext = (handler: any, classRef: any): ExecutionContext =>
        ({
            getHandler: () => handler,
            getClass: () => classRef,
            switchToHttp: () => ({
                getRequest: () => ({}),
            }),
        }) as unknown as ExecutionContext;

    it('should return true if the route is marked as public', async () => {
        // 1. Arrange: Tell the reflector to return 'true' for the Public key
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

        const context = createMockContext(() => {}, {});

        // 2. Act
        const result = await guard.canActivate(context);

        // 3. Assert
        expect(result).toBe(true);
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
            IS_PUBLIC_KEY,
            expect.any(Array),
        );
    });

    it('should call super.canActivate if the route is NOT public', async () => {
        // 1. Arrange: Reflector returns false (not a public route)
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

        // 2. Mock the parent (super) method
        // We spy on the prototype because super.canActivate refers to the parent's logic
        const superCanActivateSpy = jest
            .spyOn(AuthGuard('jwt').prototype, 'canActivate')
            .mockReturnValue(true);

        const context = createMockContext(() => {}, {});

        // 3. Act
        const result = await guard.canActivate(context);

        // 4. Assert
        expect(result).toBe(true);
        expect(superCanActivateSpy).toHaveBeenCalled();
    });
});
