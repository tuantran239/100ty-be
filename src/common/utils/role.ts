import { RoleId } from 'src/role/role.type';
import { User } from 'src/user/user.entity';
import { IsNull } from 'typeorm';

export const filterRole = (me: User, checkInit?: boolean) => {
  let user: any = undefined;

  const role = me.role;

  if (role.id === RoleId.ADMIN) {
    user = [{ id: me.id }, { managerId: me.id }];
  } else if (role.id === RoleId.USER) {
    user = [{ id: me.id }];
  }

  if (user !== undefined && checkInit) {
    user.push({
        id: IsNull()
    });
  }

  return user;
};
