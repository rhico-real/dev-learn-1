import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        return next.handle().pipe(
            map((response: Record<string, unknown> | null | undefined) => {
                if (response === null || response === undefined) {
                    return { data: null };
                }

                if (response.data && response.meta) {
                    return response;
                }

                return { data: response };
            }),
        );
    }
}
