import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { ICheckRole, ROLES_KEY } from '../decorator/roles.decorator';
import { checkRoleValid } from '../utils/validate';
import { Request } from 'express';
import { DataSource } from 'typeorm';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private i18n: I18nCustomService,
    private dataSource: DataSource,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ICheckRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const req = context.switchToHttp().getRequest() as Request;

    checkRoleValid(req, requiredRoles, this.i18n, this.dataSource);

    return true;
  }
}
