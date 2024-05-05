import { Injectable } from '@nestjs/common';
import { CashType } from 'src/common/interface';
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

  async getTotalCash(): Promise<{
    receipt: { number: number; total: number };
    payment: { number: number; total: number };
  }> {
    const totalReceipt = (await this.cashRepository
      .createQueryBuilder('cash')
      .where(`cash.type=:type`, { type: CashType.RECEIPT })
      .andWhere(`deleted_at is null`)
      .andWhere(`"isDeductionMoney" is null`)
      .select(`COUNT(cash.id)`, 'number')
      .addSelect('SUM(cash.amount)', 'total')
      .getRawOne()) as { number: number; total: number };

    const totalPayment = (await this.cashRepository
      .createQueryBuilder('cash')
      .where(`cash.type=:type`, { type: CashType.PAYMENT })
      .andWhere(`deleted_at is null`)
      .select(`COUNT(cash.id)`, 'number')
      .addSelect('SUM(cash.amount)', 'total')
      .getRawOne()) as { number: number; total: number };

    return {
      receipt: {
        number: parseInt((totalReceipt.number ?? 0) + ''),
        total: parseInt((totalReceipt.total ?? 0) + ''),
      },
      payment: {
        number: parseInt((totalPayment.number ?? 0) + ''),
        total: parseInt((totalPayment.total ?? 0) + ''),
      },
    };
  }
}
