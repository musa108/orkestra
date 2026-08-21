import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const correlationId = req.headers['x-correlation-id'] ?? randomUUID();
    req.correlationId = correlationId;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `${req.method} ${req.url} [${correlationId}] ${Date.now() - start}ms`,
        );
      }),
    );
  }
}
