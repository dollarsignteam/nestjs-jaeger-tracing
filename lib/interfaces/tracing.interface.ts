export interface TracingObject {
  tracing?: TracingData;
}

export interface TracingData {
  carrier?: string;
  operation: string;
  parent?: TracingData;
}

export interface TracingContext extends TracingObject {
  isSerialized: boolean;
  payload: unknown;
}
