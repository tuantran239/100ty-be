import { Injectable } from '@nestjs/common';
import { CASH_CODE_PREFIX } from 'src/cash/cash.controller';
import { Cash } from 'src/cash/cash.entity';
import { CashFilterType, CashType, ContractType } from 'src/common/interface';
import {
  PaymentStatusHistory,
  TransactionHistoryType,
} from 'src/common/interface/history';
import { BaseService } from 'src/common/service/base.service';
import { generatePrefixNumberId } from 'src/common/utils/generated-id';
import { getFullName } from 'src/common/utils/get-full-name';
import {
  getContentTransactionHistory,
  getNoteTransactionHistory,
} from 'src/common/utils/history';
import {
  convertPostgresDate,
  formatDate,
  getDateLocal,
} from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import { CreateTransactionHistoryDto } from 'src/transaction-history/dto/create-transaction-history';
import { User } from 'src/user/user.entity';
import {
  DataSource,
  EntityManager,
  Equal,
  FindManyOptions,
  FindOneOptions,
  IsNull,
  Or,
  Repository,
} from 'typeorm';
import { CreatePaymentHistoryDto } from './dto/create-payment-history';
import { PayMoneyDto } from './dto/pay-money';
import { UpdatePaymentHistoryDto } from './dto/update-payment-history';
import { PaymentHistory } from './payment-history.entity';
import { ContractService } from 'src/contract/contract.service';

@Injectable()
export class PaymentHistoryService extends BaseService<
  PaymentHistory,
  CreatePaymentHistoryDto,
  UpdatePaymentHistoryDto
> {
  protected manager: EntityManager;
  private paymentHistoryRepository: Repository<PaymentHistory>;
  constructor(
    private dataSource: DataSource,
    private contractService: ContractService,
    private databaseService: DatabaseService,
  ) {
    super();
    this.manager = this.dataSource.manager;
    this.paymentHistoryRepository =
      this.dataSource.manager.getRepository(PaymentHistory);
  }

  async create(payload: CreatePaymentHistoryDto): Promise<PaymentHistory> {
    const newPaymentHistory =
      await this.paymentHistoryRepository.create(payload);
    return await this.paymentHistoryRepository.save(newPaymentHistory);
  }

  async updateTransaction(id: string, payload: PayMoneyDto): Promise<any> {
    const { result, paymentHistory } =
      await this.databaseService.runTransaction(async (repositories) => {
        const {
          paymentHistoryRepository,
          cashRepository,
          transactionHistoryRepository,
          pawnRepository,
        } = repositories;

        const paymentHistoryFind = await paymentHistoryRepository.findOne({
          where: { id },
        });

        if (!paymentHistoryFind) {
          throw new Error('Không tìm thấy lịch đóng');
        }

        const relations =
          paymentHistoryFind.contractType === ContractType.BAT_HO
            ? ['batHo', 'batHo.customer', 'batHo.user']
            : ['pawn', 'pawn.customer', 'pawn.user'];

        const paymentHistory = await paymentHistoryRepository.findOne({
          where: { id },
          relations,
        });

        const contractId =
          paymentHistory.batHo?.contractId ?? paymentHistory.pawn?.contractId;

        if (paymentHistoryFind.contractType === ContractType.BAT_HO) {
          if (paymentHistory.batHo?.maturityDate) {
            throw new Error('Hợp đồng này đã đáo hạn');
          }

          if (paymentHistory.isDeductionMoney) {
            throw new Error('Không thể thay đổi ngày cắt');
          }
        } else if (paymentHistoryFind.contractType === ContractType.CAM_DO) {
          if (paymentHistory.pawn?.settlementDate) {
            throw new Error('Hợp đồng này đã tất toán');
          }
        }

        const cash = await cashRepository.findOne({
          where: {
            contractId: paymentHistory.contractId,
            filterType: CashFilterType.RECEIPT_CONTRACT,
          },
        });

        const result = await paymentHistoryRepository.update(
          { id },
          {
            payDate: payload.payDate
              ? convertPostgresDate(payload.payDate)
              : convertPostgresDate(formatDate(new Date())),
            updated_at: new Date(),
            payMoney: payload.customerPaymentAmount,
            paymentStatus: payload.paymentStatus,
            note: payload.note,
          },
        );

        if (payload.paymentStatus === null) {
          if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
            cash.amount = cash.amount - paymentHistory.payMoney;
            await cashRepository.save(cash);
            await transactionHistoryRepository.delete({
              paymentHistoryId: paymentHistory.id,
            });
          }

          return { result, paymentHistory };
        }

        let payloadTransactionHistory: CreateTransactionHistoryDto = {
          batHoId: paymentHistory.batHoId,
          pawnId: paymentHistory.pawnId,
          userId: paymentHistory.userId,
          contractId: paymentHistory.contractId,
          type: '',
          content: '',
          moneyAdd: 0,
          moneySub: 0,
          otherMoney: 0,
        };

        if (payload.paymentStatus == PaymentStatusHistory.FINISH) {
          payloadTransactionHistory = {
            ...payloadTransactionHistory,
            type: TransactionHistoryType.PAYMENT,
            content: getContentTransactionHistory(
              TransactionHistoryType.PAYMENT,
              contractId,
            ),
            moneyAdd: payload.customerPaymentAmount,
            note: getNoteTransactionHistory(
              TransactionHistoryType.PAYMENT,
              formatDate(paymentHistory.startDate),
            ),
            createAt: getDateLocal(new Date()),
            paymentHistoryId: paymentHistory.id,
          };

          const newTransactionHistory =
            await transactionHistoryRepository.create(
              payloadTransactionHistory,
            );

          await transactionHistoryRepository.save(newTransactionHistory);
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

        return { result, paymentHistory };
      });

    await this.contractService.updateBatHoStatus(paymentHistory?.batHo?.id);

    await this.contractService.updatePawnStatus(paymentHistory?.pawn?.id);

    return result;
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

  async checkAndUpdateCashPaymentHistory(userId: string) {
    const cashRepository = this.dataSource.manager.getRepository(Cash);
    const userRepository = this.dataSource.manager.getRepository(User);

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    const paymentHistories = await this.list({
      where: {
        paymentStatus: Equal(PaymentStatusHistory.FINISH),
        isDeductionMoney: false,
      },
      relations: ['batHo', 'batHo.customer'],
    });

    await Promise.allSettled(
      paymentHistories.map(async (paymentHistory) => {
        const cash = await cashRepository.findOne({
          where: { paymentHistoryId: paymentHistory.id },
        });
        if (!cash) {
          const newCashFinish = await cashRepository.create({
            staff: user?.fullName ?? user?.username,
            traders: getFullName(
              paymentHistory.batHo?.customer?.firstName ?? '',
              paymentHistory.batHo?.customer?.lastName ?? '',
            ),
            type: CashType.RECEIPT,
            amount: paymentHistory.payMoney,
            createAt: convertPostgresDate(formatDate(new Date())),
            code: generatePrefixNumberId(CASH_CODE_PREFIX),
            isContract: true,
            contractType: ContractType.BAT_HO,
            paymentHistoryId: paymentHistory.id,
            note: `Thu bát họ hợp đồng ${paymentHistory.batHo?.contractId}`,
            batHoId: paymentHistory.batHo?.id,
          });

          await cashRepository.save(newCashFinish);
        }
      }),
    );
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
