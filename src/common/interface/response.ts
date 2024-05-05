import { Role } from 'src/role/entities/role.entity';
import { User } from 'src/user/user.entity';

export interface UserResponseData extends Omit<User, 'beforeInsert'> {
  role: Omit<Role, 'beforeInsert'> | null;
}
