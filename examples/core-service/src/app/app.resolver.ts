import { Tracing, TracingData } from '@dollarsign/nestjs-jaeger-tracing';
import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Observable } from 'rxjs';

import { AppService } from './app.service';

@Resolver()
export class AppResolver {
  constructor(private readonly appService: AppService) {}

  @Query('getHello')
  hello(@Tracing() tracing: TracingData): string {
    Logger.log({ getHello: tracing });
    return this.appService.getHello();
  }

  @Mutation('echoMessage')
  replyMessage(
    @Tracing() tracing: TracingData,
    @Args('message') message: string,
  ): Observable<string> {
    Logger.log({ echoMessage: tracing });
    return this.appService.echoMessage(message);
  }
}
