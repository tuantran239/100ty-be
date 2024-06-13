import { Role } from 'src/role/entities/role.entity';
import { User } from '../user.entity';

export class UserResponseDto extends User {
  role: Role;
  permissions: any[];
  password: undefined;
  roles: undefined;
}
