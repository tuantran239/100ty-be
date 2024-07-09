import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from 'src/database/database.service';
import { I18nCustomService } from 'src/i18n-custom/i18n-custom.service';
import { ICheckRole, ROLES_KEY } from '../decorator/roles.decorator';
import { RequestCustom } from '../types/http';
import { convertUrlToSubject } from '../utils/convert';
import { checkRoleValid } from '../utils/validate';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private i18n: I18nCustomService,
    private databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ICheckRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const req = context.switchToHttp().getRequest() as RequestCustom;

    const entity = convertUrlToSubject(req.url as string);

    await checkRoleValid(req, requiredRoles, this.i18n, this.databaseService, entity);

    return true;
  }
}
