import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContractType } from 'src/common/types';
import { TransactionHistoryType } from 'src/transaction-history/transaction-history.type';
import { BaseService } from 'src/common/service/base.service';
import { getDateLocal } from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
} from 'typeorm';
import { CreateTransactionHistoryDto } from './dto/create-transaction-history';
import { UpdateTransactionHistoryDto } from './dto/update-transaction-history';
import { TransactionHistory } from './transaction-history.entity';
import { TransactionHistoryRepository } from './transaction-history.repository';
import { PaymentStatusHistory } from 'src/payment-history/payment-history.type';

@Injectable()
export class TransactionHistoryService extends BaseService<
  TransactionHistory,
  CreateTransactionHistoryDto,
  UpdateTransactionHistoryDto
> {
  protected manager: EntityManager;

  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
    @InjectRepository(TransactionHistory)
    private readonly transactionHistoryRepository: TransactionHistoryRepository,
  ) {
    super();
    this.manager = this.dataSource.manager;
  }

  async create(
    payload: CreateTransactionHistoryDto,
  ): Promise<TransactionHistory> {
    return this.transactionHistoryRepository.createTransactionHistory(payload);
  }

  async update(id: string, payload: UpdateTransactionHistoryDto): Promise<any> {
    return this.transactionHistoryRepository.updateTransactionHistory({
      ...payload,
      id,
    });
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

  async convertTransactionPaymentHistory() {
    let total = 0;
    let updated = 0;

    await this.databaseService.runTransaction(async (repositories) => {
      const { batHoRepository, transactionHistoryRepository } = repositories;

      const contracts = await batHoRepository.find({
        relations: ['paymentHistories', 'user'],
      });

      total = contracts.reduce(
        (total, contract) => total + contract.paymentHistories?.length ?? 0,
        0,
      );

      total += contracts.length;

      await Promise.all(
        contracts.map(async (contract) => {
          const paymentHistories = contract.paymentHistories ?? [];

          await transactionHistoryRepository.delete({ batHoId: contract.id });

          await transactionHistoryRepository.createPayloadAndSave({
            contract: { icloud: contract },
            type: TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT,
            money: contract.fundedAmount,
            otherMoney: 0,
            createdAt: contract.loanDate,
          });

          updated++;

          await Promise.all(
            paymentHistories.map(async (paymentHistory) => {
              if (
                paymentHistory.paymentStatus === PaymentStatusHistory.FINISH
              ) {
                const type = paymentHistory.isDeductionMoney
                  ? TransactionHistoryType.DEDUCTION_MONEY
                  : TransactionHistoryType.PAYMENT;

                await transactionHistoryRepository.createPayloadAndSave({
                  contract: { icloud: contract },
                  type,
                  money: paymentHistory.payMoney,
                  otherMoney: 0,
                  createdAt: getDateLocal(new Date(paymentHistory.updated_at)),
                  paymentHistoryId: paymentHistory.id,
                });

                updated++;
              }
            }),
          );
        }),
      );
    });

    return { result: `updated: ${updated}/${total}` };
  }

  async updateContractType() {
    let total = 0;
    let updated = 0;

    await this.databaseService.runTransaction(async (repositories) => {
      const { transactionHistoryRepository } = repositories;

      const transactionHistories = await transactionHistoryRepository.find();

      total = transactionHistories.length;

      await Promise.all(
        transactionHistories.map(async (transactionHistory) => {
          await transactionHistoryRepository.update(
            { id: transactionHistory.id },
            {
              contractType: transactionHistory.pawnId
                ? ContractType.CAM_DO
                : ContractType.BAT_HO,
            },
          );

          updated++;
        }),
      );
    });

    return { result: `updated: ${updated}/${total}` };
  }
}
