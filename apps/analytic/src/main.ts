import { NestFactory } from '@nestjs/core';
import { AnalyticModule } from './analytic.module';

async function bootstrap() {
  const app = await NestFactory.create(AnalyticModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
