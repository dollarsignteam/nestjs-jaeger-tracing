import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Injectable()
export class AppService {
  constructor(
    @Inject('MAIN_SERVICE') private mainClient: ClientProxy,
    @Inject('MATH_SERVICE') private mathClient: ClientProxy,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  echoMessage(message: string): Observable<string> {
    const pattern = { cmd: 'echoMessage' };
    const payload = `echo: ${message}`;
    return this.mainClient.send<string, string>(pattern, payload);
  }

  execute(): Observable<number> {
    const pattern = { cmd: 'sum' };
    const data = [1, 2, 3, 4, 5];
    return this.mathClient.send<number>(pattern, data);
  }
}
