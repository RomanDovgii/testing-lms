import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthorizationController } from './controllers/authorization.controller';
import { UserController } from './controllers/user.controller';
import { TestingController } from './controllers/testing.controller';
import { AnalyticController } from './controllers/analytic.controller';
import { GatewayController } from './gateway.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    JwtModule.register({
          secret: process.env.JWT_SECRET || 'super_secret_jwt_for_development',
          signOptions: {expiresIn: '10h'}
    }),
    ClientsModule.register([
      {
        name: 'AUTHORIZATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 5001,
        }
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 5002,
        }
      },
      {
        name: 'TESTING_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 5003,
        }
      },
      {
        name: 'ANALYTIC_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 5004,
        }
      }
    ]),
  ],
  controllers: [GatewayController, AuthorizationController, UserController, TestingController, AnalyticController],
  providers: [GatewayService, JwtAuthGuard, RolesGuard],
})
export class GatewayModule {}
