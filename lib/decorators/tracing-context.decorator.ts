import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

import { TracingData, TracingObject } from '../interfaces';

export const Tracing = createParamDecorator(
  (key: keyof TracingData, context: ExecutionContext) => {
    const contextType = context.getType<GqlContextType>();
    let tracingData: TracingData;
    if (contextType === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      tracingData = ctx.getContext<TracingObject>().tracing;
    }
    if (contextType === 'http') {
      const ctx = context.switchToHttp();
      tracingData = ctx.getRequest<TracingObject>().tracing;
    }
    if (contextType === 'rpc') {
      const ctx = context.switchToRpc();
      tracingData = ctx.getContext<TracingObject>().tracing;
    }
    return key ? tracingData && tracingData[key] : tracingData;
  },
);
