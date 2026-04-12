import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.message
                : 'Internal server error';

        if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `Internal Server Error: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
                exception instanceof Error ? exception.stack : undefined,
            );

            response.status(status).json({
                statusCode: status,
                message: 'Internal server error',
                timestamp: new Date().toISOString(),
                path: request.url,
            });
        } else {
            if (exception instanceof Error) {
                this.logger.warn(`${message}`, exception.stack);
            }

            response.status(status).json({
                statusCode: status,
                message: this.sanitizeMessage(message),
                timestamp: new Date().toISOString(),
                path: request.url,
            });
        }
    }

    private sanitizeMessage(message: string): string {
        const internalPatterns = [
            /mongodb:\/\//i,
            /E11000/i,
            /MongoError/i,
            /SyntaxError/i,
            /ReferenceError/i,
            /TypeError/i,
        ];

        for (const pattern of internalPatterns) {
            if (pattern.test(message)) {
                return 'An error occurred while processing your request';
            }
        }

        return message;
    }
}
