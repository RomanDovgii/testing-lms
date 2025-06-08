import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule, {
    cors: {
      origin: '*',
    }
  });
  
  await app.listen(5000);
}
bootstrap();
