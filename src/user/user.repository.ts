import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { RoleId } from 'src/common/interface';

export interface UserRepository extends Repository<User> {
  this: Repository<User>;
  createUser(payload: CreateUserDto): Promise<User>;
  updateUser(payload: UpdateUserDto & { id: string }): Promise<User>;
  filterRole(me: User): any;
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
    this: Repository<User>,
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
    this: Repository<User>,
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

  filterRole(me: User): any {
    let user = undefined;

    const role = me.roles[0];

    if (role.id === RoleId.ADMIN) {
      user = [{ id: me.id }, { managerId: me.id }];
    } else if (role.id === RoleId.USER) {
      user = { id: me.id };
    }

    return user;
  },
};
