import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/service/base.service';
import {
  DataSource,
  DeleteResult,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
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
    @InjectRepository(User) private readonly userRepository: UserRepository,
  ) {
    super();
    this.manager = this.dataSource.manager;
  }

  async create(payload: CreateUserDto): Promise<User> {
    return await this.userRepository.createUser(payload);
  }

  async update(id: string, payload: UpdateUserDto): Promise<any> {
    return await this.userRepository.updateUser({ ...payload, id });
  }

  async delete(id: string): Promise<DeleteResult> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error();
    }

    return await this.userRepository.update(user.id, {
      deleted_at: new Date(),
    });
  }

  async list(options: FindManyOptions<User>): Promise<User[]> {
    return this.userRepository.find(options);
  }

  async listAndCount(
    options: FindManyOptions<User>,
  ): Promise<[User[], number]> {
    return this.userRepository.findAndCount(options);
  }

  async retrieveById(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  retrieveOne(options: FindOneOptions<User>): Promise<User> {
    return this.userRepository.findOne(options);
  }
}
