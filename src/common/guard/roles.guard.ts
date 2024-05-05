import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from 'src/user/user.entity';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { RoleName } from '../interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user as User;

    const isAuthorization = requiredRoles.some((role) =>
      user.roles?.some((userRole) => userRole.name == role),
    );

    if (!isAuthorization) {
      throw new Error('Truy cập bị từ chối, bạn không đủ quyền.');
    }

    return true;
  }
}
