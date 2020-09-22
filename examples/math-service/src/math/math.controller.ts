import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  accumulate(@Payload() data: number[]): number {
    return (data || []).reduce((a, b) => a + b);
  }
}
