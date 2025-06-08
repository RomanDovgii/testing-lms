import { NestFactory } from '@nestjs/core';
import { AnalyticModule } from './analytic.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AnalyticModule, {
          transport: Transport.TCP,
          options: {
            host: '127.0.0.1',
            port: 5004,
          },
        });
        await app.listen();
}
bootstrap();
