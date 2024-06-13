import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import {
  DataSource,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { CreatePaymentHistoryDto } from './dto/create-payment-history';
import { PayMoneyDto } from './dto/pay-money';
import { UpdatePaymentHistoryDto } from './dto/update-payment-history';
import { PaymentHistory } from './payment-history.entity';
import { ContractType } from 'src/common/interface';
import { PaymentHistoryType } from 'src/common/interface/history';
import { convertPostgresDate, formatDate } from 'src/common/utils/time';

export interface PaymentHistoryRepository extends Repository<PaymentHistory> {
  this: PaymentHistoryRepository;

  checkPaymentHistoryExist(
    options: FindOneOptions<PaymentHistory>,
    throwError?: { message?: string },
    exist?: boolean,
  ): Promise<PaymentHistory>;

  createPaymentHistory(
    payload: CreatePaymentHistoryDto,
  ): Promise<PaymentHistory>;

  createManyPaymentHistory(
    payloads: CreatePaymentHistoryDto[],
  ): Promise<PaymentHistory[]>;

  updatePaymentHistory(
    payload: UpdatePaymentHistoryDto & { id: string },
  ): Promise<PaymentHistory>;

  updatePaymentHistory(
    payload: UpdatePaymentHistoryDto & { id: string },
  ): Promise<PaymentHistory>;

  payLoanMoney(payload: PayMoneyDto & { id: string }): Promise<{
    paymentHistoryUpdated: PaymentHistory;
    paymentHistory: PaymentHistory;
  }>;

  sortRowId(payload: {
    pawnId?: string;
    cloudId?: string;
  }): Promise<PaymentHistory[]>;
}

export const PaymentHistoryRepositoryProvider = {
  provide: getRepositoryToken(PaymentHistory),
  inject: [getDataSourceToken()],
  useFactory(dataSource: DataSource) {
    return dataSource
      .getRepository(PaymentHistory)
      .extend(PaymentHistoryRepository);
  },
};

export const PaymentHistoryRepository: Pick<PaymentHistoryRepository, any> = {
  async checkPaymentHistoryExist(
    this: PaymentHistoryRepository,
    options: FindOneOptions<PaymentHistory>,
    throwError?: { message?: string },
    exist?: boolean,
  ) {
    const customer = await this.findOne(options);

    if (throwError) {
      if (exist && customer) {
        throw new Error(throwError.message ?? 'PaymentHistory exist');
      } else if (!exist && !customer) {
        throw new Error(
          throwError.message ?? 'PaymentHistory not found or not exist',
        );
      }
    }

    return customer;
  },

  async createPaymentHistory(
    this: PaymentHistoryRepository,
    payload: CreatePaymentHistoryDto,
  ): Promise<PaymentHistory> {
    const newPaymentHistory = await this.create(payload);
    return this.save(newPaymentHistory);
  },

  async createManyPaymentHistory(
    this: PaymentHistoryRepository,
    payloads: CreatePaymentHistoryDto[],
  ): Promise<PaymentHistory[]> {
    return await Promise.all(
      payloads.map(async (payload) => await this.createPaymentHistory(payload)),
    );
  },

  async updatePaymentHistory(
    this: PaymentHistoryRepository,
    payload: UpdatePaymentHistoryDto & { id: string },
  ): Promise<PaymentHistory> {
    const { id } = payload;

    const paymentHistory = await this.checkPaymentHistoryExist(
      { where: { id } },
      {},
    );

    const keysPayload = Object.keys(payload);

    for (let i = 0; i < keysPayload.length; i++) {
      const key = keysPayload[i];

      const payloadValue = payload[key];

      const paymentHistoryValue = paymentHistory[key];

      if (
        paymentHistoryValue !== undefined &&
        paymentHistoryValue !== payloadValue
      ) {
        paymentHistory[key] = payloadValue;
      }
    }

    paymentHistory.updated_at = new Date();

    await this.save({
      ...paymentHistory,
    });

    return paymentHistory;
  },

  async payLoanMoney(
    this: PaymentHistoryRepository,
    payload: PayMoneyDto & { id: string },
  ): Promise<{
    paymentHistoryUpdated: PaymentHistory;
    paymentHistory: PaymentHistory;
  }> {
    const { id } = payload;

    const paymentHistoryFind = await this.checkPaymentHistoryExist(
      { where: { id } },
      {},
    );

    const relations =
      paymentHistoryFind.contractType === ContractType.BAT_HO
        ? ['batHo', 'batHo.customer', 'batHo.user']
        : ['pawn', 'pawn.customer', 'pawn.user'];

    const paymentHistory = await this.findOne({
      where: { id },
      relations,
    });

    const canNotChangeList = [
      PaymentHistoryType.DEDUCTION_MONEY,
      PaymentHistoryType.OTHER_MONEY_DOWN_ROOT,
      PaymentHistoryType.DOWN_ROOT_MONEY,
    ] as string[];

    if (canNotChangeList.includes(paymentHistory.type)) {
      throw new Error('Khoản tiền này đã được đóng trước, không thể thay đổi.');
    }

    if (paymentHistoryFind.contractType === ContractType.BAT_HO) {
      if (paymentHistory.batHo?.maturityDate) {
        throw new Error('Hợp đồng này đã đáo hạn');
      }
    } else if (paymentHistoryFind.contractType === ContractType.CAM_DO) {
      if (paymentHistory.pawn?.settlementDate) {
        throw new Error('Hợp đồng này đã tất toán');
      }
    }

    const paymentHistoryUpdated = await this.updatePaymentHistory({
      id: paymentHistory.id,
      payDate: payload.payDate
        ? convertPostgresDate(payload.payDate)
        : convertPostgresDate(formatDate(new Date())),
      payMoney: payload.customerPaymentAmount,
      paymentStatus: payload.paymentStatus,
      note: payload.note,
    });

    return { paymentHistoryUpdated, paymentHistory };
  },

  async sortRowId(
    this: PaymentHistoryRepository,
    payload: {
      pawnId?: string;
      cloudId?: string;
    },
  ): Promise<PaymentHistory[]> {
    const options: FindManyOptions<PaymentHistory> = {
      where: {
        batHoId: payload.cloudId,
        pawnId: payload.pawnId,
      },
    };

    const paymentHistories = await this.find(options);

    const sortPaymentHistories = paymentHistories.sort((p1, p2) => {
      if (new Date(p1.endDate).getTime() === new Date(p2.endDate).getTime()) {
        return p1.payNeed - p2.payNeed;
      }

      return new Date(p1.endDate).getTime() - new Date(p2.endDate).getTime();
    });

    await Promise.all(
      sortPaymentHistories.map(async (paymentHistory, index) => {
        await this.update({ id: paymentHistory.id }, { rowId: index + 1 });
      }),
    );

    return sortPaymentHistories;
  },
};
