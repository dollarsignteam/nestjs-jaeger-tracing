import { TracingModule } from '@dollarsign/nestjs-jaeger-tracing';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';

const logger = new Logger('NestMicroservice');

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: 3001,
        ...TracingModule.getParserOptions(),
      },
    },
  );
  app.listen(() => logger.verbose('Microservice is listening'));
}

(async (): Promise<void> => {
  await bootstrap();
})().catch((error: Error) => {
  logger.error(`Nest microservice error: ${error.message}`);
});
