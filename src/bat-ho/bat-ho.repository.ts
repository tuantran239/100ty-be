import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { ContractType, DebitStatus } from 'src/common/types';
import {
  convertPostgresDate,
  countFromToDate,
  countTimeMustPay,
  formatDate,
} from 'src/common/utils/time';
import { CreatePaymentHistoryDto } from 'src/payment-history/dto/create-payment-history';
import {
  DataSource,
  FindManyOptions,
  FindOneOptions,
  Not,
  Repository,
} from 'typeorm';
import { BatHo } from './bat-ho.entity';
import { BatHoResponseDto } from './dto/bat-ho-response.dto';
import { CreateBatHoDto } from './dto/create-bat-ho.dto';
import { UpdateBatHoDto } from './dto/update-bat-ho.dto';
import { isLastPaymentHistoryUnFinish } from 'src/common/utils/calculate';
import {
  PaymentHistoryType,
  PaymentStatusHistory,
} from 'src/payment-history/payment-history.type';
import { UserRepository } from 'src/user/user.repository';

const BAT_HO_RELATIONS = [
  'customer',
  'paymentHistories',
  'device',
  'hostServer',
  'user',
  'transactionHistories',
];

export interface BatHoRepository extends Repository<BatHo> {
  this: BatHoRepository;

  checkBatHoExist(
    options: FindOneOptions<BatHo>,
    throwError?: { message?: string },
    exist?: boolean,
  ): Promise<BatHo>;

  createBatHo(payload: CreateBatHoDto): Promise<BatHo>;

  updateBatHo(payload: UpdateBatHoDto & { id: string }): Promise<BatHo>;

  mapBatHoResponse(batHo: BatHo | null): BatHoResponseDto | null;

  listBatHo(
    options: FindManyOptions<BatHo>,
  ): Promise<{ list_bat_ho: BatHoResponseDto[]; total: number }>;

  getBatHo(options: FindOneOptions<BatHo>): Promise<BatHoResponseDto>;

  createPaymentHistoriesPayload(
    batHo: BatHo,
  ): Promise<CreatePaymentHistoryDto[]>;

  getRelations(excludes: string[]): string[];

  calculateLateAndBadPayment(icloud: BatHo): {
    latePaymentDay;
    latePaymentMoney;
    badDebitMoney;
    isFinishToday;
  };

  updateStatus(id: string): Promise<void>;
}

export const BatHoRepositoryProvider = {
  provide: getRepositoryToken(BatHo),
  inject: [getDataSourceToken()],
  useFactory(dataSource: DataSource) {
    return dataSource.getRepository(BatHo).extend(BatHoCustomRepository);
  },
};

export const BatHoCustomRepository: Pick<BatHoRepository, any> = {
  async checkBatHoExist(
    this: BatHoRepository,
    options: FindOneOptions<BatHo>,
    throwError?: { message?: string },
    exist?: boolean,
  ) {
    const BatHo = await this.findOne(options);

    if (throwError) {
      if (exist && BatHo) {
        throw new Error(throwError.message ?? 'BatHo exist');
      } else if (!exist && !BatHo) {
        throw new Error(throwError.message ?? 'BatHo not found or not exist');
      }
    }

    return BatHo;
  },

  async createBatHo(
    this: BatHoRepository,
    payload: CreateBatHoDto,
  ): Promise<BatHo> {
    await this.checkBatHoExist(
      { where: { contractId: payload.contractId } },
      { message: 'Mã hợp đồng đã tồn tại.' },
      true,
    );

    await this.checkBatHoExist(
      {
        where: {
          customerId: payload.customerId,
          debitStatus: Not(DebitStatus.COMPLETED),
        },
      },
      { message: 'Khách hàng còn hợp đồng chưa trả hết.' },
      true,
    );

    if (payload.loanAmount > payload.revenueReceived) {
      throw new Error('Số tiền nhận về không thể nhỏ hơn khoản vay');
    }

    let newBatHo = await this.create({
      ...payload,
      loanDate: convertPostgresDate(payload.loanDate),
    });

    newBatHo = await this.save(newBatHo);

    return newBatHo;
  },

  async updateBatHo(
    this: BatHoRepository,
    payload: UpdateBatHoDto & { id: string },
  ): Promise<BatHo> {
    const { id } = payload;

    const batHo = await this.checkBatHoExist(
      { where: { id } },
      { message: 'Hợp đồng không tồn tại' },
    );

    if (payload.contractId && batHo.contractId !== payload.contractId) {
      await this.checkBatHoExist(
        { where: { contractId: payload.contractId } },
        { message: 'Mã hợp đồng đã tồn tại.' },
        true,
      );
    }

    if (payload.debitStatus && payload.debitStatus !== batHo.debitStatus) {
      const values = Object.values(DebitStatus);
      const isDebitStatus = values.find((val) => val == payload.debitStatus);
      if (!isDebitStatus) {
        throw new Error('Trạng thái không hợp lệ.');
      }
    }

    if (payload.loanAmount > payload.revenueReceived) {
      throw new Error('Số tiền nhận về không thể nhỏ hơn khoản vay');
    }

    const keysPayload = Object.keys(payload);

    for (let i = 0; i < keysPayload.length; i++) {
      const key = keysPayload[i];

      const payloadValue = payload[key];

      const BatHoValue = batHo[key];

      if (BatHoValue !== undefined && BatHoValue !== payloadValue) {
        batHo[key] = payloadValue;
      }
    }

    batHo.updated_at = new Date();

    await this.save({
      ...batHo,
      loanDate: payload.loanDate
        ? convertPostgresDate(payload.loanDate)
        : batHo.loanDate,
    });

    return batHo;
  },

  calculateLateAndBadPayment(icloud: BatHo): {
    latePaymentDay;
    latePaymentMoney;
    badDebitMoney;
    isFinishToday;
  } {
    let latePaymentDay = 0;
    let latePaymentMoney = 0;
    let badDebitMoney = 0;
    let isFinishToday = false;

    const { debitStatus } = icloud;

    const today = formatDate(new Date());

    const paymentHistories = icloud.paymentHistories ?? [];

    const sortPaymentHistories = paymentHistories.sort(
      (p1, p2) => p1.rowId - p2.rowId,
    );

    const lastPaymentHistoryUnfinish = sortPaymentHistories.find(
      (paymentHistory) => isLastPaymentHistoryUnFinish(paymentHistory),
    );

    if (lastPaymentHistoryUnfinish) {
      latePaymentDay = Math.round(
        (new Date(convertPostgresDate(today)).getTime() -
          new Date(lastPaymentHistoryUnfinish.startDate).getTime()) /
          86400000,
      );

      latePaymentMoney = sortPaymentHistories.reduce(
        (total, paymentHistory) => {
          if (isLastPaymentHistoryUnFinish(paymentHistory)) {
            return paymentHistory.payNeed + total;
          }
          return total;
        },
        0,
      );
    }

    if (debitStatus == DebitStatus.BAD_DEBIT) {
      badDebitMoney = paymentHistories.reduce((total, paymentHistory) => {
        if (paymentHistory.paymentStatus != PaymentStatusHistory.FINISH) {
          return total + paymentHistory.payNeed;
        }
        return total;
      }, 0);
    }

    const paymentHistoryFinishToday = sortPaymentHistories.find(
      (paymentHistory) =>
        paymentHistory.paymentStatus == PaymentStatusHistory.FINISH &&
        formatDate(paymentHistory.startDate) == today,
    );

    if (paymentHistoryFinishToday) {
      isFinishToday = true;
    }

    return { latePaymentDay, latePaymentMoney, badDebitMoney, isFinishToday };
  },

  mapBatHoResponse(batHo: BatHo | null): BatHoResponseDto | null {
    if (batHo) {
      const { loanDurationDays, loanDate, revenueReceived } = batHo;

      const paymentMethod = 'day';
      const numberOfPayments = 1;

      const dates = countFromToDate(
        loanDurationDays - 1,
        paymentMethod as any,
        0,
        loanDate,
      );

      const timePayment = `${formatDate(dates[0])} -> ${formatDate(dates[1])} (${loanDurationDays} ngày)`;

      const duration = Math.round(loanDurationDays / numberOfPayments);
      let paidDuration = 0;

      const paymentHistories = batHo.paymentHistories;

      const moneyPaidNumber = paymentHistories.reduce(
        (total, paymentHistory) => {
          if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
            paidDuration += 1;
            return (total += paymentHistory.payMoney);
          }
          return total;
        },
        0,
      );

      const paymentHistory = paymentHistories.find(
        (paymentHistory) => !paymentHistory.paymentStatus,
      );

      const { latePaymentDay, latePaymentMoney, badDebitMoney, isFinishToday } =
        this.calculateLateAndBadPayment(batHo);

      return {
        ...batHo,
        loanDate: formatDate(batHo.loanDate),
        timePayment,
        moneyPaid: `${moneyPaidNumber.toLocaleString()}${paidDuration ? `(${paidDuration}) kỳ` : ''}`,
        oldDebit: 0,
        moneyOneDay: parseInt((revenueReceived / loanDurationDays).toString()),
        moneyMustPay: `${(revenueReceived - moneyPaidNumber).toLocaleString()}${duration - paidDuration ? ` (${duration - paidDuration}) kỳ` : ''}`,
        dateMustPay: paymentHistory
          ? countTimeMustPay(paymentHistory.endDate)
          : '',
        latePaymentDay,
        isFinishToday,
        latePaymentMoney,
        badDebitMoney,
        moneyPaidNumber,
        moneyMustPayNumber: revenueReceived - moneyPaidNumber,
      } as BatHoResponseDto;
    }

    return null;
  },

  async listBatHo(
    this: BatHoRepository,
    options: FindManyOptions<BatHo>,
  ): Promise<{ list_bat_ho: BatHoResponseDto[]; total: number }> {
    const batHoData = await this.findAndCount(options);

    const list_bat_ho = await Promise.all(
      batHoData[0].map(async (batHo) => {
        return await this.getBatHo({
          where: { id: batHo.id },
          relations: this.getRelations([]),
        });
      }),
    );

    return { list_bat_ho, total: batHoData[1] };
  },

  async getBatHo(
    this: BatHoRepository,
    options: FindOneOptions<BatHo>,
  ): Promise<BatHoResponseDto> {
    const batHo = await this.checkBatHoExist(
      options,
      { message: 'Không tìm thấy hợp đồng' },
      false,
    );

    return this.mapBatHoResponse(batHo);
  },

  async createPaymentHistoriesPayload(
    batHo: BatHo,
  ): Promise<CreatePaymentHistoryDto[]> {
    const paymentHistories: CreatePaymentHistoryDto[] = [];

    const {
      contractId,
      loanDurationDays,
      revenueReceived,
      deductionDays,
      loanDate,
      id,
    } = batHo;

    const numberOfPayments = 1;
    const paymentMethod = 'day';

    const moneyLoan = parseInt((revenueReceived / loanDurationDays).toString());

    if (numberOfPayments >= loanDurationDays) {
      const dates = countFromToDate(
        numberOfPayments,
        paymentMethod as any,
        0,
        loanDate,
      );
      paymentHistories.push({
        rowId: 1,
        batHoId: id,
        userId: batHo.userId,
        contractId: contractId,
        startDate: convertPostgresDate(formatDate(dates[0])),
        endDate: convertPostgresDate(formatDate(dates[1])),
        paymentMethod,
        payMoney: 0,
        payNeed: revenueReceived,
        paymentStatus: null,
        contractType: ContractType.BAT_HO,
        workspaceId: batHo.workspaceId,
        storeId: batHo.storeId,
      });
      return paymentHistories;
    }

    let index = 1;
    let duration = loanDurationDays;
    let skip = 0;

    while (duration > 0) {
      let numOfDay = 0;

      if (loanDurationDays - (skip + numberOfPayments) >= 0) {
        numOfDay = numberOfPayments;
      } else {
        numOfDay = loanDurationDays - skip;
      }

      const dates = countFromToDate(
        numberOfPayments,
        paymentMethod as any,
        skip,
        loanDate,
      );

      paymentHistories.push({
        rowId: index,
        batHoId: id,
        userId: batHo.userId,
        contractId: contractId,
        startDate: convertPostgresDate(formatDate(dates[0])),
        endDate: convertPostgresDate(formatDate(dates[1])),
        paymentMethod,
        payMoney: 0,
        payNeed: numOfDay * moneyLoan,
        paymentStatus: null,
        contractType: ContractType.BAT_HO,
        type: PaymentHistoryType.INTEREST_MONEY,
        workspaceId: batHo.workspaceId,
        storeId: batHo.storeId,
      });

      index++;
      duration -= numberOfPayments;
      skip += numberOfPayments;
    }

    for (let i = 1; i <= deductionDays; i++) {
      const paymentHistory = paymentHistories.find(
        (pHistory) => pHistory.rowId === i,
      );
      if (paymentHistory) {
        paymentHistory.paymentStatus = PaymentStatusHistory.FINISH;
        paymentHistory.payDate = convertPostgresDate(formatDate(new Date()));
        paymentHistory.payMoney = moneyLoan;
        paymentHistory.isDeductionMoney = true;
        paymentHistory.type = PaymentHistoryType.DEDUCTION_MONEY;
        paymentHistories[i - 1] = { ...paymentHistory };
      }
    }

    return paymentHistories;
  },

  getRelations(excludes: string[]): string[] {
    return BAT_HO_RELATIONS.filter((relation) => !excludes.includes(relation));
  },

  async updateStatus(this: BatHoRepository, id: string): Promise<void> {
    const batHo = await this.findOne({
      where: [{ id }, { contractId: id }],
      relations: ['paymentHistories'],
    });

    if (batHo) {
      const paymentHistories = batHo.paymentHistories ?? [];

      const sortPaymentHistories = paymentHistories.sort(
        (a, b) => a.rowId - b.rowId,
      );

      const today = formatDate(new Date());

      const lastPaymentHistory =
        sortPaymentHistories[sortPaymentHistories.length - 1];

      const todayTime = new Date(
        convertPostgresDate(formatDate(new Date())),
      ).setHours(0, 0, 0, 0);

      const lastTime = new Date(
        convertPostgresDate(
          formatDate(lastPaymentHistory?.startDate ?? new Date()),
        ),
      ).setHours(0, 0, 0, 0);

      const allFinish = sortPaymentHistories.every(
        (paymentHistory) =>
          paymentHistory.paymentStatus === PaymentStatusHistory.FINISH,
      );

      const isNotNull = sortPaymentHistories.some(
        (paymentHistory) => paymentHistory.paymentStatus === null,
      );

      if (allFinish) {
        batHo.debitStatus = DebitStatus.COMPLETED;
        await this.save({ ...batHo });
        return;
      }

      if (!isNotNull) {
        batHo.debitStatus = DebitStatus.BAD_DEBIT;
        await this.save({ ...batHo });
        return;
      }

      if ((todayTime - lastTime) / 86400000 >= 1) {
        batHo.debitStatus = DebitStatus.BAD_DEBIT;
      } else {
        const notFinishPaymentHistory = sortPaymentHistories.find(
          (paymentHistory) =>
            paymentHistory.paymentStatus !== PaymentStatusHistory.FINISH &&
            formatDate(paymentHistory.startDate) !== today &&
            new Date(paymentHistory.startDate).getTime() <
              new Date(convertPostgresDate(today)).getTime(),
        );

        if (notFinishPaymentHistory) {
          const timeNot = new Date(
            convertPostgresDate(
              formatDate(notFinishPaymentHistory?.startDate ?? new Date()),
            ),
          ).getTime();

          if (timeNot > lastTime) {
            batHo.debitStatus = DebitStatus.BAD_DEBIT;
            await this.save({ ...batHo });
            return;
          } else {
            batHo.debitStatus = DebitStatus.LATE_PAYMENT;
            await this.save({ ...batHo });
            return;
          }
        }
      }

      batHo.debitStatus = DebitStatus.IN_DEBIT;
      await this.save({ ...batHo });
    }
  },
};
