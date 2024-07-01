import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import { DatabaseService } from 'src/database/database.service';
import {
  DataSource,
  DeleteResult,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  IsNull,
} from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService extends BaseService<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  protected manager: EntityManager;
  constructor(
    private dataSource: DataSource,
    public readonly repository: UserRepository,
    private databaseService: DatabaseService,
  ) {
    super();
    this.manager = this.dataSource.manager;
  }

  async convertUserRole() {
    let total = 0;
    let updated = 0;

    await this.databaseService.runTransaction(async (repositories) => {
      const { userRepository, userRoleRepository } = repositories;

      const users = await userRepository.find({ where: { roleId: IsNull() } });

      total = users.length;

      await Promise.allSettled(
        users.map(async (user) => {
          const userRole = await userRoleRepository.findOne({
            where: { user_id: user.id },
          });

          if (userRole) {
            const result = await userRepository.update(
              { id: user.id },
              { roleId: userRole.role_id },
            );

            if (result.affected === 1) {
              updated++;
            }
          }
        }),
      );
    });

    console.log(
      `>>>>>>>>>>>>>>>>>>>>>>>>>> Update User Role: { updated: ${updated}/${total}  }`,
    );
  }

  async create(payload: CreateUserDto): Promise<User> {
    return await this.repository.createAndSave(payload);
  }

  async update(id: string, payload: UpdateUserDto): Promise<any> {
    return await this.repository.updateAndSave({ ...payload, id });
  }

  async delete(id: string): Promise<DeleteResult> {
    const user = await this.repository.findOne({ where: { id } });

    if (!user) {
      throw new Error();
    }

    return await this.repository.update(user.id, {
      deleted_at: new Date(),
    });
  }

  async list(options: FindManyOptions<User>): Promise<User[]> {
    return this.repository.find(options);
  }

  async listAndCount(
    options: FindManyOptions<User>,
  ): Promise<[User[], number]> {
    return this.repository.findAndCount(options);
  }

  async retrieveById(id: string): Promise<User> {
    return this.repository.findOne({ where: { id } });
  }

  retrieveOne(options: FindOneOptions<User>): Promise<User> {
    return this.repository.findOne(options);
  }
}
