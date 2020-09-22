import { FactoryProvider, ModuleMetadata, Type } from '@nestjs/common';

import { TracingModuleOptions } from './tracing-module-options.interface';

export interface TracingOptionsFactory {
  createTracingOptions(): Promise<TracingModuleOptions> | TracingModuleOptions;
}

export interface TracingModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'>,
    Pick<FactoryProvider, 'inject'> {
  name?: string;
  useClass?: Type<TracingOptionsFactory>;
  useExisting?: Type<TracingOptionsFactory>;
  useFactory?: (
    ...args: unknown[]
  ) => Promise<TracingModuleOptions> | TracingModuleOptions;
}
