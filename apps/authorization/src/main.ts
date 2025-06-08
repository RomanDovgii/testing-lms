import { NestFactory } from '@nestjs/core';
import { AuthorizationModule } from './authorization.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AuthorizationModule, {
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 5001,
    },
  });
  await app.listen();
}
bootstrap();
