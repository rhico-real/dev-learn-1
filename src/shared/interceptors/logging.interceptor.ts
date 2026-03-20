import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor{
    private readonly logger = new Logger(LoggingInterceptor.name);
    
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const {method, url, user} = request;
        const now = Date.now();

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const statusCode = response.statusCode;
                const responseTime = Date.now() - now;
                const userId = user?.userId || 'Anonymous';

                this.logger.log(
                    `${method} ${url} ${statusCode} - ${responseTime}ms - User: ${userId}`
                )
            })
        );
    }
}