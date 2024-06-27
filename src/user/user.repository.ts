import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { IsNull, Repository } from 'typeorm';
import { User } from './user.entity';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { RoleId } from 'src/role/role.type';

export interface UserRepository extends Repository<User> {
  this: UserRepository;
  createUser(payload: CreateUserDto): Promise<User>;
  updateUser(payload: UpdateUserDto & { id: string }): Promise<User>;
  filterRole(me: User, checkInit?: boolean): any;
  mapUserResponse: (user: User | null) => UserResponseDto | null;
  checkRoleAction(me: User): boolean;
}

export const UserRepositoryProvider = {
  provide: getRepositoryToken(User),
  inject: [getDataSourceToken()],
  useFactory(dataSource: DataSource) {
    return dataSource.getRepository(User).extend(userCustomRepository);
  },
};

export const userCustomRepository: Pick<UserRepository, any> = {
  async createUser(
    this: UserRepository,
    payload: CreateUserDto,
  ): Promise<User> {
    const { phoneNumber } = payload;

    const userExist = await this.findOne({ where: { phoneNumber } });

    if (userExist) {
      throw new Error(`User ${phoneNumber} already exists`);
    }

    const newUser = await this.create(payload);

    return await this.save(newUser);
  },

  async updateUser(
    this: UserRepository,
    payload: UpdateUserDto & { id: string },
  ): Promise<User> {
    const { id } = payload;

    const user = await this.findOne({ where: { id } });

    if (!user) {
      throw new Error('User not found');
    }

    const keysPayload = Object.keys(payload);

    for (let i = 0; i < keysPayload.length; i++) {
      const key = keysPayload[i];

      const payloadValue = payload[key];

      const userValue = user[key];

      if (userValue !== undefined && userValue !== payloadValue) {
        user[key] = payloadValue;
      }
    }

    user.updated_at = new Date();

    await this.save(user);

    return user;
  },

  filterRole(me: User, checkInit?: boolean): any {
    let user: any = undefined;

    const role = me.roles[0];

    if (role.id === RoleId.ADMIN) {
      user = [{ id: me.id }, { managerId: me.id }];
    } else if (role.id === RoleId.USER) {
      user = [{ id: me.id }];
    }

    if (checkInit) {
      if (user) {
        user.push({
          id: IsNull(),
        });
      }
    }

    return user;
  },

  mapUserResponse(user: User | null): UserResponseDto | null {
    if (user) {
      const role = user?.roles[0];

      let permissions = [];

      if (role) {
        permissions = role?.permissions ?? [];

        role.permissions = undefined;
      }

      const userData = {
        ...user,
        role,
        password: undefined,
        permissions,
        roles: undefined,
      };

      return {
        ...userData,
      } as UserResponseDto;
    }

    return null;
  },

  checkRoleAction(this: UserRepository, me: User): boolean {
    const meResponse = this.mapUserResponse(me);

    const meRole = meResponse.role;

    if (meRole.id === RoleId.SUPER_ADMIN) {
      return true;
    }
  },
};
