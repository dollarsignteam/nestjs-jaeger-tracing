import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app';

const logger = new Logger('NestApplication', true);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
  });
  await app.startAllMicroservicesAsync();
  await app.listen(3000);
  const url = await app.getUrl();
  logger.verbose(`Nest application is listening on ${url}`);
}

(async (): Promise<void> => {
  await bootstrap();
})().catch((error: Error) => {
  logger.error(`Nest application error: ${error.message}`);
});
