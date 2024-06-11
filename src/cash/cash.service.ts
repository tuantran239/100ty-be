import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/service/base.service';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
} from 'typeorm';
import { Cash } from './cash.entity';
import { CashRepository } from './cash.repository';
import { CreateCashDto } from './dto/create-cash.dto';
import { UpdateCashDto } from './dto/update-cash.dto';

@Injectable()
export class CashService extends BaseService<
  Cash,
  CreateCashDto,
  UpdateCashDto
> {
  protected manager: EntityManager;

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Cash)
    private readonly cashRepository: CashRepository,
  ) {
    super();
    this.manager = this.dataSource.manager;
  }

  async create(payload: CreateCashDto): Promise<Cash> {
    return this.cashRepository.createCash(payload);
  }

  async update(id: string, payload: UpdateCashDto): Promise<any> {
    return this.cashRepository.updateCash({ ...payload, id });
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
