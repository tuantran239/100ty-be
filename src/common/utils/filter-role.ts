import { User } from 'src/user/user.entity';
import { RoleId } from '../interface';

export const filterRole = (me: User) => {
  let user = undefined;

  const role = me.roles[0];

  if (role.id === RoleId.ADMIN) {
    user = [{ id: me.id }, { managerId: me.id }];
  } else if (role.id === RoleId.USER) {
    user = { id: user.id };
  }

  return user;
};
