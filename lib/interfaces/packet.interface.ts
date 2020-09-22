import { PacketId, ReadPacket } from '@nestjs/microservices';

import { TracingContext } from './tracing.interface';

export type RequestPacket<T> = ReadPacket<T> & PacketId;
export type TracingRequestPacket = RequestPacket<TracingContext>;
