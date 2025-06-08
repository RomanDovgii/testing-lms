import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { Transport } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { seedRoles } from './seeder/roles.seed';


async function bootstrap() {
  const app = await NestFactory.createMicroservice(UserModule, {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 5002,
      },
    });
    const dataSource = app.get(DataSource);
    await seedRoles(dataSource);
    
    await app.listen();
}
bootstrap();
