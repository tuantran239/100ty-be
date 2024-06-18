export enum RoleName {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
}

export enum RoleId {
  SUPER_ADMIN = 'role_super_admin',
  ADMIN = 'role_admin',
  USER = 'role_user',
}

export interface RoleData {
  name: string;
  permissions: any;
  level: number;
  link: string;
  id: string;
}
