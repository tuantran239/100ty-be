import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import { convertPostgresDate } from 'src/common/utils/time';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { Cash } from './cash.entity';
import { CreateCashDto } from './dto/create-cash.dto';
import { UpdateCashDto } from './dto/update-cash.dto';

@Injectable()
export class CashService extends BaseService<
  Cash,
  CreateCashDto,
  UpdateCashDto
> {
  protected manager: EntityManager;
  private cashRepository: Repository<Cash>;
  constructor(private dataSource: DataSource) {
    super();
    this.manager = this.dataSource.manager;
    this.cashRepository = this.dataSource.manager.getRepository(Cash);
  }

  async create(payload: CreateCashDto): Promise<Cash> {
    const newUser = await this.cashRepository.create(payload);
    return await this.cashRepository.save(newUser);
  }

  async update(id: string, payload: UpdateCashDto): Promise<any> {
    const user = await this.cashRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error();
    }

    return await this.cashRepository.update(
      { id },
      {
        ...payload,
        updated_at: new Date(),
        createAt: payload.createAt
          ? convertPostgresDate(payload.createAt)
          : undefined,
      },
    );
  }

  async delete(id: string): Promise<any> {
    const cash = await this.cashRepository.findOne({ where: { id } });

    if (!cash) {
      throw new Error('Quỹ tiền không tồn tại');
    }

    return await this.cashRepository.delete({ id });
  }

  async list(options: FindManyOptions<Cash>): Promise<Cash[]> {
    return this.cashRepository.find(options);
  }

  async listAndCount(
    options: FindManyOptions<Cash>,
  ): Promise<[Cash[], number]> {
    return this.cashRepository.findAndCount(options);
  }

  async retrieveById(id: string): Promise<Cash> {
    return this.cashRepository.findOne({ where: { id } });
  }

  retrieveOne(options: FindOneOptions<Cash>): Promise<Cash> {
    return this.cashRepository.findOne(options);
  }
}
