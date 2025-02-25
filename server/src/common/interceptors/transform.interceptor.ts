import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: string;
  msg: string | null;
  data: T;
  version: string;
  timestamp: number | null;
  sign: string | null;
  success: boolean;
  fail: boolean;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        code: '200',
        msg: null,
        data,
        version: '1.0.0',
        timestamp: Date.now(),
        sign: null,
        success: true,
        fail: false
      }))
    );
  }
}