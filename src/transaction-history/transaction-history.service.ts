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
import { DatabaseService } from 'src/database/database.service';
import {
  PaymentStatusHistory,
  TransactionHistoryType,
} from 'src/common/interface/history';
import { getContentTransactionHistory } from 'src/common/utils/history';
import { getDateLocal } from 'src/common/utils/time';
import { ContractType } from 'src/common/interface';

@Injectable()
export class TransactionHistoryService extends BaseService<
  TransactionHistory,
  CreateTransactionHistoryDto,
  UpdateTransactionHistoryDto
> {
  protected manager: EntityManager;
  private transactionHistoryRepository: Repository<TransactionHistory>;
  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
  ) {
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

          const transactionNewContract =
            await transactionHistoryRepository.create({
              userId: contract.user.id,
              batHoId: contract.id,
              contractId: contract.contractId,
              type: TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT,
              content: getContentTransactionHistory(
                TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT,
                contract.contractId,
              ),
              moneySub: contract.fundedAmount,
              moneyAdd: 0,
              otherMoney: 0,
              createAt: contract.loanDate,
              createdAt: contract.loanDate,
            });

          await transactionHistoryRepository.save(transactionNewContract);
          updated++;

          await Promise.all(
            paymentHistories.map(async (paymentHistory) => {
              if (
                paymentHistory.paymentStatus === PaymentStatusHistory.FINISH
              ) {
                const type = paymentHistory.isDeductionMoney
                  ? TransactionHistoryType.DEDUCTION_MONEY
                  : TransactionHistoryType.PAYMENT;

                const transactionNewContract =
                  await transactionHistoryRepository.create({
                    userId: contract.user.id,
                    batHoId: contract.id,
                    contractId: contract.contractId,
                    type,
                    content: getContentTransactionHistory(
                      type,
                      contract.contractId,
                    ),
                    moneySub: 0,
                    moneyAdd: paymentHistory.payMoney,
                    otherMoney: 0,
                    createAt: getDateLocal(new Date(paymentHistory.updated_at)),
                    paymentHistoryId: paymentHistory.id,
                    createdAt: getDateLocal(
                      new Date(paymentHistory.updated_at),
                    ),
                  });

                await transactionHistoryRepository.save(transactionNewContract);
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
