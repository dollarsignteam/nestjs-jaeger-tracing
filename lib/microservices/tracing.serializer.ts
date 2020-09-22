import { AsyncContext } from '@donews/nestjs-async-hooks';
import { Logger } from '@nestjs/common';
import { ReadPacket, Serializer } from '@nestjs/microservices';
import { Tags } from 'opentracing';

import { TRACING_CARRIER_INFO } from '../constants';
import { TracingContext, TracingData } from '../interfaces';
import { TracerProvider } from '../tracer';

import { isRequestPacket } from './packet.utils';

export class TracingSerializer implements Serializer {
  private readonly logger = new Logger(TracingSerializer.name);

  private readonly asyncContext: AsyncContext;

  constructor() {
    this.asyncContext = AsyncContext.getInstance();
  }

  getTracingData(packet: ReadPacket): TracingData {
    try {
      return this.asyncContext.get(TRACING_CARRIER_INFO);
    } catch (error) {
      const { message } = error as Error;
      const messagePattern = JSON.stringify(packet.pattern);
      this.logger.warn(`Serialize without tracing: ${messagePattern}`);
      this.logger.warn(message);
      return undefined;
    }
  }

  createTracing(packet: ReadPacket): TracingData {
    const parentTracing = this.getTracingData(packet);
    const tracingProvider = TracerProvider.getInstance();
    if (!tracingProvider) {
      this.logger.warn('TracerProvider Instance could not be created');
      return parentTracing;
    }
    const tracer = tracingProvider.getTracer();
    const operation = ['rpc', 'client'].join(':');
    const parentSpan = tracingProvider.extractTracing(parentTracing);
    const span = tracer.startSpan(operation, {
      childOf: parentSpan,
      tags: { kind: 'client' },
    });
    const carrier = tracingProvider.getCarrier(span);
    const tracing: TracingData = {
      operation,
      carrier,
      parent: parentTracing,
    };
    const messagePattern = JSON.stringify(packet.pattern);
    span.setTag(Tags.COMPONENT, 'rpc');
    span.setTag('rpc.pattern', messagePattern);
    span.log({ payload: JSON.stringify(packet.data, null, 2) });
    span.finish();
    return tracing;
  }

  serialize(packet: unknown): ReadPacket<TracingContext> | unknown {
    if (isRequestPacket(packet)) {
      const { data, ...rest } = packet;
      const tracing = this.createTracing(packet);
      const context: TracingContext = {
        tracing,
        payload: data,
        isSerialized: true,
      };
      const req = { data: context, ...rest };
      this.logger.verbose({ sendingPacket: req });
      return { data: context, ...rest };
    }
    return packet;
  }
}
