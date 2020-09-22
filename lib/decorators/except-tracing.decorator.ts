import { applyDecorators, SetMetadata } from '@nestjs/common';

import { EXCEPT_TRACING } from '../constants';

export function ExceptTracing(): MethodDecorator {
  return applyDecorators(SetMetadata(EXCEPT_TRACING, true));
}
