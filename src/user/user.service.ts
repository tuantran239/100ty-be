import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import {
  DataSource,
  DeleteResult,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UserService extends BaseService<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  protected manager: EntityManager;
  private userRepository: Repository<User>;
  constructor(private dataSource: DataSource) {
    super();
    this.manager = this.dataSource.manager;
    this.userRepository = this.dataSource.manager.getRepository(User);
  }

  async create(payload: CreateUserDto): Promise<User> {
    const newUser = await this.userRepository.create(payload);
    return await this.userRepository.save(newUser);
  }

  async update(id: string, payload: UpdateUserDto): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error();
    }

    return await this.userRepository.update(
      { id },
      { ...payload, updated_at: new Date() },
    );
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
