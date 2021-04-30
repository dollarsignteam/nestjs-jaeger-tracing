import { AsyncContext } from '@donews/nestjs-async-hooks';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { TcpContext } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { GraphQLResolveInfo } from 'graphql';
import { SpanContext, Tags, Tracer } from 'opentracing';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { EXCEPT_TRACING, TRACING_CARRIER_INFO } from '../constants';
import { InjectTracer, InjectTracerProvider } from '../decorators';
import { TracingContext, TracingData, TracingObject } from '../interfaces';
import { isTracingContext } from '../microservices';
import { TracerProvider } from '../tracer';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TracingInterceptor.name);

  constructor(
    @InjectTracer()
    private readonly tracer: Tracer,
    @InjectTracerProvider()
    private readonly tracerProvider: TracerProvider,
    private readonly asyncContext: AsyncContext,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const contextType = context.getType<GqlContextType>();
    const except = this.reflector.get<boolean>(
      EXCEPT_TRACING,
      context.getHandler(),
    );
    if (contextType === 'ws') {
      return next.handle();
    }
    if (except) {
      if (contextType === 'rpc') {
        const ctx = context.switchToRpc();
        const data = ctx.getData<TracingContext>();
        if (isTracingContext(data)) {
          context.getArgs()[0] = data.payload;
        }
      }
      return next.handle();
    }
    let parentSpanContext: SpanContext;
    const spanTags = new Map<string, unknown>();
    const spanLogs: Array<Record<string, unknown>> = [];
    const constructorRef = context.getClass().name;
    const handler = context.getHandler().name;
    const operation = [contextType, constructorRef, handler].join(':');
    const tracingData: TracingData = { operation };
    spanTags.set('operation', operation);
    spanTags.set(Tags.COMPONENT, contextType);
    if (contextType === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      ctx.getContext<TracingObject>().tracing = tracingData;
      const { path } = ctx.getInfo<GraphQLResolveInfo>();
      spanTags.set('graphql.name', `${path?.key}`);
      spanTags.set('graphql.type', `${path?.typename}`.toLowerCase());
    }
    if (contextType === 'http') {
      const ctx = context.switchToHttp();
      ctx.getRequest<TracingObject>().tracing = tracingData;
      const { statusCode } = ctx.getResponse<Response>();
      const { headers, method, path, ip, ips } = ctx.getRequest<Request>();
      spanTags.set(Tags.HTTP_URL, path);
      spanTags.set(Tags.HTTP_METHOD, `${method}`.toUpperCase());
      spanTags.set(Tags.PEER_HOST_IPV4, [ip, ...ips].join(', '));
      spanTags.set(Tags.HTTP_STATUS_CODE, statusCode);
      parentSpanContext = this.tracerProvider.extractHeaders(headers);
    }
    if (contextType === 'rpc') {
      const ctx = context.switchToRpc();
      const data = ctx.getData<TracingContext>();
      if (isTracingContext(data)) {
        const { payload, tracing } = data;
        context.getArgs()[0] = payload;
        tracingData.parent = tracing;
        parentSpanContext = this.tracerProvider.extractTracing(tracing);
      }
      ctx.getContext<TracingObject>().tracing = tracingData;
      if (typeof ctx.getContext().getPattern === 'function') {
        const pattern = ctx.getContext().getPattern();
        spanTags.set('rpc.pattern', pattern);
      }
      if (typeof ctx.getContext().getChannel === 'function') {
        const channel = ctx.getContext().getChannel();
        spanTags.set('rpc.channel', channel);
      }
      if (typeof ctx.getContext().getSubject === 'function') {
        const subject = ctx.getContext().getSubject();
        spanTags.set('rpc.subject', subject);
      }
      if (typeof ctx.getContext().getTopic === 'function') {
        const topic = ctx.getContext().getTopic();
        spanTags.set('rpc.topic', topic);
      }
      spanLogs.push({ payload: JSON.stringify(ctx.getData(), null, 2) });
    }
    return this.asyncContext.run(() => {
      const span = this.tracer.startSpan(operation, {
        childOf: parentSpanContext,
        tags: { kind: 'server' },
      });
      spanTags.forEach((value: string, key: string) => {
        span.setTag(key, value);
      });
      spanLogs.forEach((log) => {
        span.log(log);
      });
      tracingData.carrier = this.tracerProvider.getCarrier(span);
      this.asyncContext.set(TRACING_CARRIER_INFO, tracingData);
      return next.handle().pipe(
        tap(() => {
          span.finish();
        }),
        catchError((error: Error) => {
          span.setTag(Tags.ERROR, true);
          if (error instanceof HttpException) {
            const tag =
              contextType === 'http'
                ? Tags.HTTP_STATUS_CODE
                : 'error.status_code';
            span.setTag(tag, error.getStatus());
          }
          span.log({
            event: Tags.ERROR,
            'error.object': error,
            message: error.message,
            stack: error.stack,
          });
          span.finish();
          return throwError(error);
        }),
      );
    }) as Observable<unknown>;
  }
}
