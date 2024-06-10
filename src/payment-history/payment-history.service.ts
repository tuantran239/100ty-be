import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CashFilterType } from 'src/common/interface';
import {
  PaymentStatusHistory,
  TransactionHistoryType,
} from 'src/common/interface/history';
import { BaseService } from 'src/common/service/base.service';
import { getFullName } from 'src/common/utils/get-full-name';
import { getNoteTransactionHistory } from 'src/common/utils/history';
import {
  convertPostgresDate,
  formatDate,
  getDateLocal,
} from 'src/common/utils/time';
import { ContractService } from 'src/contract/contract.service';
import { DatabaseService } from 'src/database/database.service';
import {
  DataSource,
  EntityManager,
  Equal,
  FindManyOptions,
  FindOneOptions,
  IsNull,
  Or,
} from 'typeorm';
import { CreatePaymentHistoryDto } from './dto/create-payment-history';
import { PayMoneyDto } from './dto/pay-money';
import { UpdatePaymentHistoryDto } from './dto/update-payment-history';
import { PaymentHistory } from './payment-history.entity';
import { PaymentHistoryRepository } from './payment-history.repository';

@Injectable()
export class PaymentHistoryService extends BaseService<
  PaymentHistory,
  CreatePaymentHistoryDto,
  UpdatePaymentHistoryDto
> {
  protected manager: EntityManager;
  constructor(
    private dataSource: DataSource,
    private contractService: ContractService,
    private databaseService: DatabaseService,
    @InjectRepository(PaymentHistory)
    private readonly paymentHistoryRepository: PaymentHistoryRepository,
  ) {
    super();
    this.manager = this.dataSource.manager;
  }

  async create(payload: CreatePaymentHistoryDto): Promise<PaymentHistory> {
    return this.paymentHistoryRepository.create(payload);
  }

  async payLoanMoney(id: string, payload: PayMoneyDto): Promise<any> {
    const { paymentHistory, paymentHistoryUpdated } =
      await this.databaseService.runTransaction(async (repositories) => {
        const {
          paymentHistoryRepository,
          cashRepository,
          transactionHistoryRepository,
          pawnRepository,
        } = repositories;

        const { paymentHistory, paymentHistoryUpdated } =
          await paymentHistoryRepository.payLoanMoney({
            ...payload,
            id,
          });

        const cash = await cashRepository.findOne({
          where: {
            contractId: paymentHistory.contractId,
            filterType: CashFilterType.RECEIPT_CONTRACT,
          },
        });

        if (payload.paymentStatus === null) {
          if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
            cash.amount = cash.amount - paymentHistory.payMoney;
            await cashRepository.save(cash);
            await transactionHistoryRepository.delete({
              paymentHistoryId: paymentHistory.id,
            });
          }

          return { paymentHistory, paymentHistoryUpdated };
        }

        if (payload.paymentStatus == PaymentStatusHistory.FINISH) {
          await transactionHistoryRepository.createPayloadAndSave({
            contract: {
              pawn: paymentHistory.pawn,
              icloud: paymentHistory.batHo,
            },
            type: TransactionHistoryType.PAYMENT,
            money: payload.customerPaymentAmount,
            otherMoney: 0,
            note: getNoteTransactionHistory(
              TransactionHistoryType.PAYMENT,
              formatDate(paymentHistory.startDate),
            ),
            createdAt: getDateLocal(new Date()),
            paymentHistoryId: paymentHistory.id,
          });
        } else if (payload.paymentStatus == PaymentStatusHistory.UNFINISH) {
          await transactionHistoryRepository.delete({
            paymentHistoryId: paymentHistory.id,
          });
        }

        if (payload.paymentStatus == PaymentStatusHistory.FINISH) {
          cash.amount = cash.amount + payload.customerPaymentAmount;
          await cashRepository.save(cash);
        } else if (
          payload.paymentStatus == PaymentStatusHistory.UNFINISH &&
          paymentHistory.paymentStatus == PaymentStatusHistory.FINISH
        ) {
          cash.amount = cash.amount - payload.customerPaymentAmount;
          await cashRepository.save(cash);
        }

        if (paymentHistory.pawn && !paymentHistory.pawn.startPaymentDate) {
          await pawnRepository.update(
            {
              id: paymentHistory.pawnId,
            },
            { startPaymentDate: convertPostgresDate(formatDate(new Date())) },
          );
        }

        return { paymentHistory, paymentHistoryUpdated };
      });

    await this.contractService.updateBatHoStatus(paymentHistory?.batHo?.id);

    await this.contractService.updatePawnStatus(paymentHistory?.pawn?.id);

    return paymentHistoryUpdated;
  }

  async update(id: string, payload: UpdatePaymentHistoryDto): Promise<any> {
    const paymentHistory = await this.paymentHistoryRepository.findOne({
      where: { id },
    });

    if (!paymentHistory) {
      throw new Error();
    }

    return await this.paymentHistoryRepository.update(
      { id },
      { ...payload, updated_at: new Date() },
    );
  }

  async delete(id: string): Promise<any> {
    const paymentHistory = await this.paymentHistoryRepository.findOne({
      where: { id },
    });

    if (!paymentHistory) {
      throw new Error();
    }

    return await this.paymentHistoryRepository.update(
      { id },
      { deleted_at: new Date() },
    );
  }

  async list(
    options: FindManyOptions<PaymentHistory>,
  ): Promise<PaymentHistory[]> {
    return this.paymentHistoryRepository.find(options);
  }

  async listAndCount(
    options: FindManyOptions<PaymentHistory>,
  ): Promise<[PaymentHistory[], number]> {
    return this.paymentHistoryRepository.findAndCount(options);
  }

  async retrieveById(id: string): Promise<PaymentHistory> {
    return this.paymentHistoryRepository.findOne({ where: { id } });
  }

  retrieveOne(
    options: FindOneOptions<PaymentHistory>,
  ): Promise<PaymentHistory> {
    return this.paymentHistoryRepository.findOne(options);
  }

  async checkTotal() {
    const paymentHistories = await this.paymentHistoryRepository.find({
      where: { isDeductionMoney: Or(Equal(false), IsNull()) },
    });

    const paymentHistoriesDeduction = await this.paymentHistoryRepository.find({
      where: { isDeductionMoney: true },
    });

    const finishMoney = paymentHistories.reduce((total, paymentHistory) => {
      if (paymentHistory.paymentStatus == PaymentStatusHistory.FINISH) {
        return total + paymentHistory.payMoney;
      }
      return total;
    }, 0);

    const unfinishMoney = paymentHistories.reduce((total, paymentHistory) => {
      if (paymentHistory.paymentStatus == PaymentStatusHistory.UNFINISH) {
        return total + paymentHistory.payNeed;
      }
      return total;
    }, 0);

    const deductionMoney = paymentHistoriesDeduction.reduce(
      (total, paymentHistory) => {
        return total + paymentHistory.payMoney;
      },
      0,
    );

    return {
      finishMoney,
      unfinishMoney,
      deductionMoney,
    };
  }

  async listPaymentHistoryFinishToday(
    options: FindManyOptions<PaymentHistory>,
  ) {
    const data = await this.paymentHistoryRepository.findAndCount(options);

    const totalPage = data[1];
    const paymentHistories = data[0];

    const totalMoney = paymentHistories.reduce((total, paymentHistory) => {
      return total + paymentHistory.payMoney;
    }, 0);

    const list_payment_history = paymentHistories.map((paymentHistory) => {
      return {
        contractId: paymentHistory.batHo?.contractId,
        customer: getFullName(
          paymentHistory?.batHo?.customer?.firstName,
          paymentHistory?.batHo?.customer?.lastName,
        ),
        employee:
          paymentHistory.batHo?.user?.fullName ??
          paymentHistory.batHo?.user?.username,
        money: paymentHistory.payMoney,
      };
    });

    return { totalPage, totalMoney, list_payment_history };
  }
}
