import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export interface ICheckRole {
  id: string;
  conditions?: {
    levelRole?: boolean;
    createdBy?: boolean;
  };
  entity?: any;
}

export const CheckRoles = (...roles: ICheckRole[]) =>
  SetMetadata(ROLES_KEY, roles);
