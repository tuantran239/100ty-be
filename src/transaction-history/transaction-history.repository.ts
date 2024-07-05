import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { convertPostgresDate, formatDate } from 'src/common/utils/time';
import { DataSource, FindOneOptions, Repository } from 'typeorm';
import { TransactionHistory } from './transaction-history.entity';
import { CreateTransactionHistoryDto } from './dto/create-transaction-history';
import { UpdateTransactionHistoryDto } from './dto/update-transaction-history';
import { Pawn } from 'src/pawn/pawn.entity';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { ContractType } from 'src/common/types';
import { TransactionHistoryType } from 'src/transaction-history/transaction-history.type';
import { getContentTransactionHistory } from 'src/common/utils/history';

export enum TransactionHistoryMoneyType {
  SUB = 'sub',
  ADD = 'add',
}

export interface TransactionHistoryRepository
  extends Repository<TransactionHistory> {
  this: TransactionHistoryRepository;

  checkTransactionHistoryExist(
    options: FindOneOptions<TransactionHistory>,
    throwError?: { message?: string },
    exist?: boolean,
  ): Promise<TransactionHistory>;

  createPayloadAndSave(payload: {
    contract: { pawn?: Pawn; icloud?: BatHo };
    type: string;
    money: number;
    otherMoney: number;
    createdAt: string;
    paymentHistoryId?: string;
    note?: string;
  }): Promise<TransactionHistory>;

  createTransactionHistory(
    payload: CreateTransactionHistoryDto,
  ): Promise<TransactionHistory>;

  updateTransactionHistory(
    payload: UpdateTransactionHistoryDto & { id: string },
  ): Promise<TransactionHistory>;
}

export const TransactionHistoryRepositoryProvider = {
  provide: getRepositoryToken(TransactionHistory),
  inject: [getDataSourceToken()],
  useFactory(dataSource: DataSource) {
    return dataSource
      .getRepository(TransactionHistory)
      .extend(TransactionHistoryRepository);
  },
};

export const TransactionHistoryRepository: Pick<
  TransactionHistoryRepository,
  any
> = {
  async checkTransactionHistoryExist(
    this: TransactionHistoryRepository,
    options: FindOneOptions<TransactionHistory>,
    throwError?: { message?: string },
    exist?: boolean,
  ) {
    const customer = await this.findOne(options);

    if (throwError) {
      if (exist && customer) {
        throw new Error(throwError.message ?? 'TransactionHistory exist');
      } else if (!exist && !customer) {
        throw new Error(
          throwError.message ?? 'TransactionHistory not found or not exist',
        );
      }
    }

    return customer;
  },

  async createTransactionHistory(
    this: TransactionHistoryRepository,
    payload: CreateTransactionHistoryDto,
  ): Promise<TransactionHistory> {
    const newTransactionHistory = await this.create(payload);
    return await this.save(newTransactionHistory);
  },

  async createPayloadAndSave(
    this: TransactionHistoryRepository,
    payload: {
      contract: { pawn?: Pawn; icloud?: BatHo };
      type: string;
      money: number;
      otherMoney: number;
      createdAt: string;
      paymentHistoryId?: string;
      note?: string;
    },
  ): Promise<TransactionHistory> {
    const {
      contract: { pawn, icloud },
      type,
      createdAt,
      money,
      otherMoney,
      paymentHistoryId,
      note,
    } = payload;

    if (!pawn && !icloud) {
      throw new Error('Hợp đồng không tồn tại để tạo lịch sử giao dịch');
    }

    const userId = pawn?.userId ?? icloud?.userId;
    const contractId = pawn?.contractId ?? icloud?.contractId;
    const contractType = pawn ? ContractType.CAM_DO : ContractType.BAT_HO;
    const batHoId = icloud?.id;
    const pawnId = pawn?.id;

    const types = Object.values(TransactionHistoryType) as string[];

    if (!types.includes(type)) {
      throw new Error('Loại lịch sử giao dịch không hợp lệ');
    }

    const SUB_TYPE = [
      TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT,
      TransactionHistoryType.LOAN_MORE_MONEY,
    ] as string[];

    return await this.createTransactionHistory({
      userId,
      contractId,
      contractType,
      batHoId,
      pawnId,
      type,
      content: getContentTransactionHistory(type, contractId),
      createAt: convertPostgresDate(formatDate(createdAt)),
      createdAt: convertPostgresDate(formatDate(createdAt)),
      otherMoney,
      paymentHistoryId,
      moneyAdd: SUB_TYPE.includes(type) ? 0 : money,
      moneySub: SUB_TYPE.includes(type) ? money : 0,
      note,
      moneyType: SUB_TYPE.includes(type)
        ? TransactionHistoryMoneyType.SUB
        : TransactionHistoryMoneyType.ADD,
      workspaceId: pawn?.workspaceId ?? icloud?.workspaceId,
      storeId: pawn?.storeId ?? icloud?.storeId,
    });
  },

  async updateTransactionHistory(
    this: TransactionHistoryRepository,
    payload: UpdateTransactionHistoryDto & { id: string },
  ): Promise<TransactionHistory> {
    const { id } = payload;

    const transactionHistory = await this.checkTransactionHistoryExist(
      { where: { id } },
      {},
    );

    const keysPayload = Object.keys(payload);

    for (let i = 0; i < keysPayload.length; i++) {
      const key = keysPayload[i];

      const payloadValue = payload[key];

      const transactionHistoryValue = transactionHistory[key];

      if (
        transactionHistoryValue !== undefined &&
        transactionHistoryValue !== payloadValue
      ) {
        transactionHistory[key] = payloadValue;
      }
    }

    transactionHistory.updated_at = new Date();

    await this.save({
      ...transactionHistory,
      createdAt: payload.createdAt
        ? convertPostgresDate(payload.createdAt)
        : transactionHistory.createdAt,
    });

    return transactionHistory;
  },
};
