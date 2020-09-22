import { IncomingHttpHeaders } from 'http';

import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { NodeTracerProvider } from '@opentelemetry/node';
import { TracerShim } from '@opentelemetry/shim-opentracing';
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
} from '@opentelemetry/tracing';
import {
  FORMAT_HTTP_HEADERS,
  FORMAT_TEXT_MAP,
  globalTracer,
  initGlobalTracer,
  Span,
  SpanContext,
  Tracer,
} from 'opentracing';

import { TracingData, TracingModuleOptions } from '../interfaces';

export class TracerProvider {
  private static instance: TracerProvider;

  private tracer: Tracer;

  private constructor(options: TracingModuleOptions) {
    process.env.OTEL_LOG_LEVEL = 'ERROR';
    process.env.OTEL_NO_PATCH_MODULES = '*';
    this.tracer = TracerProvider.initialize(options);
  }

  private static initialize(options: TracingModuleOptions): Tracer {
    const { exporterConfig, isSimpleSpanProcessor } = options;
    const { serviceName } = exporterConfig;
    const tracerProvider = new NodeTracerProvider();
    const exporter = new JaegerExporter(exporterConfig);
    const spanProcessor = isSimpleSpanProcessor
      ? new SimpleSpanProcessor(exporter)
      : new BatchSpanProcessor(exporter);
    tracerProvider.addSpanProcessor(spanProcessor);
    tracerProvider.register();
    const tracer = tracerProvider.getTracer(serviceName);
    initGlobalTracer(new TracerShim(tracer));
    return globalTracer();
  }

  static getInstance(options?: TracingModuleOptions): TracerProvider {
    if (!this.instance && options) {
      this.instance = new TracerProvider(options);
    }
    return this.instance;
  }

  getTracer(): Tracer {
    return this.tracer;
  }

  extractHeaders(headers: IncomingHttpHeaders): SpanContext {
    const context = this.tracer.extract(FORMAT_HTTP_HEADERS, headers);
    return context || undefined;
  }

  extractTracing(tracingData: TracingData): SpanContext {
    const carrier = { traceparent: tracingData && tracingData.carrier };
    const context = this.tracer.extract(FORMAT_TEXT_MAP, carrier);
    return context || undefined;
  }

  getCarrier(span: Span): string {
    const data: Record<string, string> = {};
    this.tracer.inject(span, FORMAT_TEXT_MAP, data);
    return data.traceparent;
  }
}
