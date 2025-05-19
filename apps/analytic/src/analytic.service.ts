import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticService {
  getHello(): string {
    return 'Hello World!';
  }
}
