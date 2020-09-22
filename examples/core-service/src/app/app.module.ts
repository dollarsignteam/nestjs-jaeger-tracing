import { TracingModule } from '@dollarsign/nestjs-jaeger-tracing';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { graphqlConfig } from '../configs';

import { AppController } from './app.controller';
import { AppResolver } from './app.resolver';
import { AppService } from './app.service';

@Module({
  imports: [
    GraphQLModule.forRoot(graphqlConfig),
    ClientsModule.register([
      {
        name: 'MAIN_SERVICE',
        transport: Transport.TCP,
        options: {
          ...TracingModule.getParserOptions(),
        },
      },
      {
        name: 'MATH_SERVICE',
        transport: Transport.TCP,
        options: {
          port: 3001,
          ...TracingModule.getParserOptions(),
        },
      },
    ]),
    TracingModule.forRootAsync({
      useFactory: () => ({
        exporterConfig: {
          serviceName: 'core-service',
        },
        isSimpleSpanProcessor: true,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
