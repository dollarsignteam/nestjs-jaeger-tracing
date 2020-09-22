<div align="center">
  <h1>NestJS Jaeger Tracing</h1>
</div>
<div align="center">
  <strong>Jaeger distributed tracing for Nest framework</strong>
</div>

## Features

- Supported Environments
  - RESTful
  - GraphQL
  - Microservices

### Installation

- Yarn

```bash
yarn add @dollarsign/nestjs-jaeger-tracing
```

- NPM

```bash
npm install @dollarsign/nestjs-jaeger-tracing --save
```

### Getting Started

Register `TracingModule` module in app.module.ts

```ts
import { TracingModule } from '@dollarsign/nestjs-jaeger-tracing';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TracingModule.forRoot({
      exporterConfig: {
        serviceName: 'core-service',
      },
      isSimpleSpanProcessor: true,
    }),
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.TCP,
        options: {
          port: 3001,
          ...TracingModule.getParserOptions(),
        },
      },
    ]),
  ],
})
export class AppModule {}
```

---
