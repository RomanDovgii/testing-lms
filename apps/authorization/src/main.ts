import { NestFactory } from '@nestjs/core';
import { AuthorizationModule } from './authorization.module';
import { Transport } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { seedAdmin } from './seeder/admin.seed';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AuthorizationModule, {
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 5001,
    },
  });
  await app.listen();

  const dataSource = app.get(DataSource);
  await seedAdmin(dataSource);
}
bootstrap();
