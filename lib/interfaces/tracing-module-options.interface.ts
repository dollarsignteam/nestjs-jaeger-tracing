import { ExporterConfig } from './exporter-config.interfaces';

export interface TracingModuleOptions {
  exporterConfig: ExporterConfig;
  isSimpleSpanProcessor?: boolean;
}
