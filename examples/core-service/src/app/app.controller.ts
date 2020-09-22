import {
  ExceptTracing,
  Tracing,
  TracingData,
  TracingInterceptor,
} from '@dollarsign/nestjs-jaeger-tracing';
import {
  Controller,
  Get,
  Logger,
  NotImplementedException,
  UseInterceptors,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Observable } from 'rxjs';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ExceptTracing()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('error')
  getError(@Tracing() tracing: TracingData): never {
    Logger.log({ getError: tracing });
    throw new NotImplementedException();
  }

  @Get('sum')
  execute(): Observable<number> {
    return this.appService.execute();
  }

  @UseInterceptors(TracingInterceptor)
  @MessagePattern({ cmd: 'echoMessage' })
  echoMessage(
    @Tracing() tracing: TracingData,
    @Payload() message: string,
  ): string {
    Logger.log({ echoMessage: tracing });
    return message;
  }
}
