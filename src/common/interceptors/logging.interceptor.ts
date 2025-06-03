import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { method, url, body, query, params } = request;
    const userAgent = request.get('User-Agent') || '';
    const ip = request.ip || request.socket?.remoteAddress || 'unknown';

    const startTime = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} - IP: ${ip} - UserAgent: ${userAgent}`,
    );

    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Request Body: ${JSON.stringify(body)}`);
      this.logger.debug(`Query Params: ${JSON.stringify(query)}`);
      this.logger.debug(`Route Params: ${JSON.stringify(params)}`);
    }

    return next.handle().pipe(
      tap({
        next: (response) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          this.logger.log(
            `Outgoing Response: ${method} ${url} - ${duration}ms`,
          );

          if (process.env.NODE_ENV === 'development') {
            this.logger.debug(`Response: ${JSON.stringify(response)}`);
          }
        },
        error: (error: unknown) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

          this.logger.error(
            `Request Error: ${method} ${url} - ${duration}ms - ${errorMessage}`,
          );
        },
      }),
    );
  }
}
