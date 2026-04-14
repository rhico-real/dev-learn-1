import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
    let interceptor: TransformInterceptor<any>;

    beforeEach(() => {
        interceptor = new TransformInterceptor();
    });

    // Helper to create a mock CallHandler
    const createMockCallHandler = (data: any): CallHandler => ({
        handle: () => of(data), // Returns an Observable of the data
    });

    // Helper to create a mock ExecutionContext
    const mockContext = {} as ExecutionContext;

    it('should wrap a plain response in a { data: ... } object', (done) => {
        const responseData = { id: 1, name: 'Test' };
        const next = createMockCallHandler(responseData);

        interceptor.intercept(mockContext, next).subscribe((result) => {
            expect(result).toEqual({ data: responseData });
            done(); // Tell Jest the async test is finished
        });
    });

    it('should pass through responses that already have data and meta (pagination)', (done) => {
        const paginatedResponse = {
            data: [{ id: 1 }],
            meta: { total: 1, limit: 10, cursor: null },
        };
        const next = createMockCallHandler(paginatedResponse);

        interceptor.intercept(mockContext, next).subscribe((result) => {
            // It should NOT wrap it again. It should be exactly the same.
            expect(result).toEqual(paginatedResponse);
            expect(result.data).toBeDefined();
            expect(result.meta).toBeDefined();
            done();
        });
    });

    it('should wrap null/undefined responses in { data: null }', (done) => {
        const next = createMockCallHandler(null);

        interceptor.intercept(mockContext, next).subscribe((result) => {
            expect(result).toEqual({ data: null });
            done();
        });
    });
});
