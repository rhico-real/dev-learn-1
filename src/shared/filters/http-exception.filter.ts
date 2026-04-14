import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        const responseBody =
            typeof exceptionResponse === 'object'
                ? (exceptionResponse as Record<string, unknown>)
                : {};

        const message =
            typeof exceptionResponse === 'object'
                ? responseBody.message
                : exceptionResponse;

        const errorResponse: Record<string, unknown> = {
            statusCode: status,
            message: message,
            error: (responseBody.error as string) || 'Error',
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        if (process.env.NODE_ENV !== 'production') {
            errorResponse.stack = exception.stack;
        }

        response.status(status).json(errorResponse);
    }
}
