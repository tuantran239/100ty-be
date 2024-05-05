import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import { GroupCash } from './entity/group-cash.entity';
import { CreateGroupCashDto } from './dto/create-group-cash.dto';
import { UpdateGroupCashDto } from './dto/update-group-cash.dto';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
@Injectable()
export class GroupCashService extends BaseService<
  GroupCash,
  CreateGroupCashDto,
  UpdateGroupCashDto
> {
  protected manager: EntityManager;
  private groupCashRepository: Repository<GroupCash>;

  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
  ) {
    super();
    this.manager = this.dataSource.manager;
    this.groupCashRepository = this.dataSource.manager.getRepository(GroupCash);
  }

  async create(payload: CreateGroupCashDto): Promise<GroupCash> {
    const groupCash = await this.groupCashRepository.findOne({
      where: { id: payload.id },
    });

    if (groupCash) {
      throw new Error('Mã nhóm đã tồn tại');
    }

    const newGroupCash = await this.groupCashRepository.create(payload);
    return await this.groupCashRepository.save(newGroupCash);
  }

  async update(id: string, payload: UpdateGroupCashDto): Promise<any> {
    const groupCash = await this.groupCashRepository.findOne({ where: { id } });

    if (!groupCash) {
      throw new Error('Không tìm thấy nhóm thu chi');
    }

    return await this.groupCashRepository.update(
      { id },
      {
        ...payload,
        updated_at: new Date(),
      },
    );
  }

  async delete(id: string): Promise<any> {
    return await this.groupCashRepository.delete({ id });
  }

  async list(options: FindManyOptions<GroupCash>): Promise<GroupCash[]> {
    return this.groupCashRepository.find(options);
  }

  async listAndCount(
    options: FindManyOptions<GroupCash>,
  ): Promise<[GroupCash[], number]> {
    return this.groupCashRepository.findAndCount(options);
  }

  async retrieveById(id: string): Promise<GroupCash> {
    return this.groupCashRepository.findOne({ where: { id } });
  }

  async retrieveOne(options: FindOneOptions<GroupCash>): Promise<GroupCash> {
    return this.groupCashRepository.findOne(options);
  }
}
