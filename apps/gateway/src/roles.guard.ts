import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decorators/roles.decorator';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('USER_SERVICE') private readonly client: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const clientSocket = context.switchToWs().getClient();
    const user = clientSocket.user;

    if (!user?.email) {
      throw new UnauthorizedException('Пользователь не найден в сокете');
    }

    const role = user?.role;

    if (!requiredRoles.includes(role)) {
      throw new UnauthorizedException(`Нет доступа: недостаточно прав ${role}`);
    }

    return true;
  }
}