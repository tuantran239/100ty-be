import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/service/base.service';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { UpdateTransactionHistoryDto } from './dto/update-transaction-history';
import { TransactionHistory } from './transaction-history.entity';
import { CreateTransactionHistoryDto } from './dto/create-transaction-history';

@Injectable()
export class TransactionHistoryService extends BaseService<
  TransactionHistory,
  CreateTransactionHistoryDto,
  UpdateTransactionHistoryDto
> {
  protected manager: EntityManager;
  private transactionHistoryRepository: Repository<TransactionHistory>;
  constructor(private dataSource: DataSource) {
    super();
    this.manager = this.dataSource.manager;
    this.transactionHistoryRepository =
      this.dataSource.manager.getRepository(TransactionHistory);
  }

  async create(
    payload: CreateTransactionHistoryDto,
  ): Promise<TransactionHistory> {
    const newTransactionHistory =
      await this.transactionHistoryRepository.create(payload);
    return await this.transactionHistoryRepository.save(newTransactionHistory);
  }

  async update(id: string, payload: UpdateTransactionHistoryDto): Promise<any> {
    const transactionHistory = await this.transactionHistoryRepository.findOne({
      where: [{ id }, { contractId: id }],
    });

    if (!transactionHistory) {
      throw new Error('Không tìm thấy lịch sử gia dịch');
    }

    return await this.transactionHistoryRepository.update(
      { id },
      { ...payload, updated_at: new Date() },
    );
  }

  async delete(id: string): Promise<any> {
    const transactionHistory = await this.transactionHistoryRepository.findOne({
      where: [{ id }, { contractId: id }],
    });

    if (!transactionHistory) {
      throw new Error('Không tìm thấy lịch sử gia dịch');
    }

    return await this.transactionHistoryRepository.update(
      { id },
      { deleted_at: new Date() },
    );
  }

  async list(
    options: FindManyOptions<TransactionHistory>,
  ): Promise<TransactionHistory[]> {
    return this.transactionHistoryRepository.find(options);
  }

  async listAndCount(
    options: FindManyOptions<TransactionHistory>,
  ): Promise<[TransactionHistory[], number]> {
    return this.transactionHistoryRepository.findAndCount(options);
  }

  async retrieveById(id: string): Promise<TransactionHistory> {
    return this.transactionHistoryRepository.findOne({ where: { id } });
  }

  retrieveOne(
    options: FindOneOptions<TransactionHistory>,
  ): Promise<TransactionHistory> {
    return this.transactionHistoryRepository.findOne(options);
  }

  async convertData() {
    const transactionHistories = await this.list({});

    await Promise.all(
      transactionHistories.map(async (transactionHistory) => {
        if (transactionHistory.note?.includes('-->')) {
          const newNote = transactionHistory.note.split('-->')[0]?.trim() ?? '';
          await this.update(transactionHistory.id, { note: newNote });
        }
      }),
    );
  }
}
