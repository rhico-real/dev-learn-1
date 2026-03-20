import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter{
    catch(exception: HttpException, host: ArgumentsHost){
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        const message = typeof exceptionResponse === 'object' ? (exceptionResponse as any).message : exceptionResponse;

        const errorResponse = {
            statusCode: status,
            message: message,
            error: (exceptionResponse as any).error || 'Error',
            timestamp: new Date().toISOString(),
            path: request.url
        };

        if(process.env.NODE_ENV !== 'production'){
            (errorResponse as any).stack = exception.stack;
        }

        response.status(status).json(errorResponse);
    }
}