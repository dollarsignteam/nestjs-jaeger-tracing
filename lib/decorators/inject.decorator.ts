import { Inject } from '@nestjs/common';

import { TRACER, TRACER_PROVIDER, TRACING_MODULE_OPTIONS } from '../constants';

export function InjectTracer(): ParameterDecorator {
  return Inject(TRACER);
}

export function InjectTracerProvider(): ParameterDecorator {
  return Inject(TRACER_PROVIDER);
}

export function InjectTracingModuleOptions(): ParameterDecorator {
  return Inject(TRACING_MODULE_OPTIONS);
}
