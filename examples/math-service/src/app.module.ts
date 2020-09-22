import { TracingModule } from '@dollarsign/nestjs-jaeger-tracing';
import { Module } from '@nestjs/common';

import { MathModule } from './math/math.module';

@Module({
  imports: [
    TracingModule.forRoot({
      exporterConfig: {
        serviceName: 'math-service',
      },
      isSimpleSpanProcessor: true,
    }),
    MathModule,
  ],
})
export class AppModule {}
