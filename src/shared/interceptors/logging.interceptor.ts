import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        const request = context.switchToHttp().getRequest<{
            method: string;
            url: string;
            user?: { userId: string };
        }>();
        const { method, url, user } = request;
        const now = Date.now();

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse<{
                    statusCode: number;
                }>();
                const statusCode = response.statusCode;
                const responseTime = Date.now() - now;
                const userId = user?.userId || 'Anonymous';

                this.logger.log(
                    `${method} ${url} ${statusCode} - ${responseTime}ms - User: ${userId}`,
                );
            }),
        );
    }
}
