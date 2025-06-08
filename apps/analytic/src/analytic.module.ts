import { Module } from '@nestjs/common';
import { AnalyticController } from './analytic.controller';
import { AnalyticService } from './analytic.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: '89037839344Rd',
      database: 'student_testing_db',
      // entities: [Analytrics, Tests],
      synchronize: true,
    })
  ],
  controllers: [AnalyticController],
  providers: [AnalyticService],
})
export class AnalyticModule {}
