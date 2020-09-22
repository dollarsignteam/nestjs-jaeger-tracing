import { every, has, partial } from 'lodash';

import { RequestPacket, TracingContext } from '../interfaces';

export function isTracingContext(packet: unknown): packet is TracingContext {
  const keys: Array<keyof TracingContext> = ['payload', 'isSerialized'];
  return every(keys, partial(has, packet));
}

export function isRequestPacket<T>(
  packet: unknown,
): packet is RequestPacket<T> {
  const keys: Array<keyof RequestPacket<T>> = ['id', 'data', 'pattern'];
  return every(keys, partial(has, packet));
}
