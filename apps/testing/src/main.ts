import { NestFactory } from '@nestjs/core';
import { TestingModule } from './testing.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(TestingModule, {
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 5003,
        },
      });
      await app.listen();
}
bootstrap();
