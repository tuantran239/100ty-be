import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { DataSource } from 'typeorm';
import { ICheckRole, ROLES_KEY } from '../decorator/roles.decorator';
import { checkRoleValid } from '../utils/validate';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private i18n: I18nCustomService,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ICheckRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const req = context.switchToHttp().getRequest() as Request;

    await checkRoleValid(req, requiredRoles, this.i18n, this.dataSource);

    return true;
  }
}
