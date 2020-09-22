import { AsyncHooksModule } from '@donews/nestjs-async-hooks';
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Tracer } from 'opentracing';

import { TRACER, TRACER_PROVIDER, TRACING_MODULE_OPTIONS } from './constants';
import { TracingInterceptor } from './interceptors';
import {
  ParserOptions,
  TracingModuleAsyncOptions,
  TracingModuleOptions,
  TracingOptionsFactory,
} from './interfaces';
import { TracingSerializer } from './microservices';
import { TracerProvider } from './tracer';

@Global()
@Module({ imports: [AsyncHooksModule] })
export class TracingModule {
  private static tracer: Tracer;

  private static tracerProvider: TracerProvider;

  static forRoot(options: TracingModuleOptions): DynamicModule {
    const providers: Provider[] = [];
    TracingModule.tracerProvider = TracerProvider.getInstance(options);
    TracingModule.tracer = TracingModule.tracerProvider.getTracer();
    const optionsProvider: Provider<TracingModuleOptions> = {
      provide: TRACING_MODULE_OPTIONS,
      useValue: options,
    };
    const tracerProvider: Provider = {
      provide: TRACER,
      useValue: TracingModule.tracer,
    };
    const tracerProviderFactory: Provider = {
      provide: TRACER_PROVIDER,
      useValue: TracingModule.tracerProvider,
    };
    providers.push(optionsProvider);
    providers.push(tracerProvider);
    providers.push(tracerProviderFactory);
    return {
      module: TracingModule,
      providers: [
        ...providers,
        {
          provide: APP_INTERCEPTOR,
          useClass: TracingInterceptor,
        },
      ],
      exports: [...providers],
    };
  }

  static forRootAsync(options: TracingModuleAsyncOptions): DynamicModule {
    const asyncProviders: Provider[] = [];
    const tracerProviderFactory: Provider = {
      provide: TRACER_PROVIDER,
      useFactory: (tracingOptions: TracingModuleOptions) => {
        TracingModule.tracerProvider = TracerProvider.getInstance(
          tracingOptions,
        );
        return TracingModule.tracerProvider;
      },
      inject: [TRACING_MODULE_OPTIONS],
    };
    const tracerProvider: Provider = {
      provide: TRACER,
      useFactory: (tracingProvider: TracerProvider) => {
        TracingModule.tracer = tracingProvider.getTracer();
        return TracingModule.tracer;
      },
      inject: [TRACER_PROVIDER],
    };
    asyncProviders.push(tracerProvider);
    asyncProviders.push(tracerProviderFactory);
    asyncProviders.push(...TracingModule.createAsyncProvider(options));
    return {
      module: TracingModule,
      providers: [
        ...asyncProviders,
        {
          provide: APP_INTERCEPTOR,
          useClass: TracingInterceptor,
        },
      ],
      exports: [...asyncProviders],
    };
  }

  static createAsyncProvider(options: TracingModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const { useClass } = options;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  static createAsyncOptionsProvider(
    options: TracingModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: TRACING_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    const inject = [options.useClass || options.useExisting];
    return {
      provide: TRACING_MODULE_OPTIONS,
      useFactory: async (optionsFactory: TracingOptionsFactory) =>
        optionsFactory.createTracingOptions(),
      inject,
    };
  }

  static getParserOptions(): ParserOptions {
    return {
      serializer: new TracingSerializer(),
    };
  }
}
