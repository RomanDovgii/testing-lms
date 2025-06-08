import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { CronModule } from './cron.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(CronModule, {
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 5005,
        },
      });
      await app.listen();
}
bootstrap();