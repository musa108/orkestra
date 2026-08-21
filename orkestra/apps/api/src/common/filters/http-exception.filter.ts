import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttp ? exception.getResponse() : null;

    const message =
      typeof body === 'string'
        ? body
        : (body as any)?.message ?? (exception as Error)?.message ?? 'Internal server error';

    const errors = typeof body === 'object' && (body as any)?.message instanceof Array
      ? (body as any).message
      : undefined;

    if (!isHttp) {
      this.logger.error(exception);
    }

    response.status(status).json({
      success: false,
      message: Array.isArray(message) ? 'Validation failed.' : message,
      errors,
    });
  }
}
