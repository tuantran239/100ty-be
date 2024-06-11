import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import {
  calculateTotalDayRangeDate,
  convertPostgresDate,
  countFromToDate,
  formatDate,
} from 'src/common/utils/time';
import {
  DataSource,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { Pawn } from './pawn.entity';
import { CreatePawnDto } from './dto/create-pawn.dto';
import { UpdatePawnDto } from './dto/update-pawn.dto';
import { PawnPaymentType } from 'src/common/interface/profit';
import { CreatePaymentHistoryDto } from 'src/payment-history/dto/create-payment-history';
import {
  PawnInterestType,
  PawnPaymentPeriodType,
} from 'src/common/interface/pawn';
import { omit } from 'lodash';
import { ContractType } from 'src/common/interface';
import {
  PaymentHistoryType,
  PaymentStatusHistory,
} from 'src/common/interface/history';
import { DebitStatus } from 'src/common/interface/bat-ho';
import { PawnResponseDto } from './dto/pawn-response.dto';
import { isLastPaymentHistoryPeriodUnFinish } from 'src/common/utils/calculate';

interface InterestMoneyPayload {
  loanAmount: number;
  interestMoney: number;
  paymentPeriod: number;
  interestType: string;
  totalDayMonth?: number;
  paymentPeriodType?: string;
}

const PAWN_RELATIONS = [
  'customer',
  'paymentHistories',
  'user',
  'transactionHistories',
  'assetType',
  'extendedPeriodHistories',
];

export interface PawnRepository extends Repository<Pawn> {
  this: PawnRepository;

  checkPawnExist(
    options: FindOneOptions<Pawn>,
    throwError?: { message?: string },
    exist?: boolean,
  ): Promise<Pawn>;

  createPawn(payload: CreatePawnDto): Promise<Pawn>;

  updatePawn(payload: UpdatePawnDto & { id: string }): Promise<Pawn>;

  createPaymentHistoriesPayload(pawn: Pawn): Promise<CreatePaymentHistoryDto[]>;

  calculateInterestMoneyOneDay(payload: InterestMoneyPayload): number;

  calculateInterestMoneyDayPeriod(payload: InterestMoneyPayload): number;

  calculateInterestMoneyWeekPeriod(payload: InterestMoneyPayload): number;

  calculateInterestMoneyMonthPeriod(payload: InterestMoneyPayload): number;

  calculateInterestMoneyMonthRegularPeriod(
    payload: InterestMoneyPayload,
  ): number;

  calculateInterestMoneyEachPeriod(payload: InterestMoneyPayload): number;

  updateRevenueReceived(id: string): Promise<Pawn>;

  calculateInterestToToday(pawn: Pawn): {
    interestDayToday;
    interestMoneyToday;
  };

  calculateLateAndBadPayment(pawn: Pawn): {
    latePaymentPeriod;
    latePaymentMoney;
    badDebitMoney;
    isFinishPaymentPeriod;
  };

  mapPawnResponse(pawn: Pawn | null): PawnResponseDto | null;

  listPawn(
    options: FindManyOptions<Pawn>,
  ): Promise<{ list_pawn: PawnResponseDto[]; total: number }>;

  getPawn(options: FindOneOptions<Pawn>): Promise<PawnResponseDto>;

  getRelations(excludes: string[]): string[];

  updateStatus(id: string): Promise<void>;
}

export const PawnRepositoryProvider = {
  provide: getRepositoryToken(Pawn),
  inject: [getDataSourceToken()],
  useFactory(dataSource: DataSource) {
    return dataSource.getRepository(Pawn).extend(customerCustomRepository);
  },
};

export const customerCustomRepository: Pick<PawnRepository, any> = {
  async checkPawnExist(
    this: PawnRepository,
    options: FindOneOptions<Pawn>,
    throwError?: { message?: string },
    exist?: boolean,
  ) {
    const customer = await this.findOne(options);

    if (throwError) {
      if (exist && customer) {
        throw new Error(throwError.message ?? 'Pawn exist');
      } else if (!exist && !customer) {
        throw new Error(throwError.message ?? 'Pawn not found or not exist');
      }
    }

    return customer;
  },

  async createPawn(
    this: PawnRepository,
    payload: CreatePawnDto,
  ): Promise<Pawn> {
    await this.checkPawnExist(
      { where: { contractId: payload.contractId } },
      { message: 'Mã hợp đồng đã tồn tại.' },
      true,
    );

    let newPawn = await this.create({
      ...payload,
      files: payload.files ?? [],
      paymentType: payload.paymentType ?? PawnPaymentType.AFTER,
      rootMoney: payload.rootMoney ?? payload.loanAmount,
    });

    newPawn = await this.save(newPawn);

    return newPawn;
  },

  async updatePawn(
    this: PawnRepository,
    payload: UpdatePawnDto & { id: string },
  ): Promise<Pawn> {
    const { id } = payload;

    const pawn = await this.checkPawnExist(
      { where: { id } },
      { message: 'Hợp đồng không tồn tại' },
    );

    if (payload.debitStatus && payload.debitStatus !== pawn.debitStatus) {
      const values = Object.values(DebitStatus);
      const isDebitStatus = values.find((val) => val == payload.debitStatus);
      if (!isDebitStatus) {
        throw new Error('Trạng thái không hợp lệ.');
      }
    }

    if (payload.contractId && pawn.contractId !== payload.contractId) {
      await this.checkPawnExist(
        { where: { contractId: payload.contractId } },
        { message: 'Mã hợp đồng đã tồn tại.' },
        true,
      );
    }

    const keysPayload = Object.keys(payload);

    for (let i = 0; i < keysPayload.length; i++) {
      const key = keysPayload[i];

      const payloadValue = payload[key];

      const pawnValue = pawn[key];

      if (pawnValue !== undefined && pawnValue !== payloadValue) {
        pawn[key] = payloadValue;
      }
    }

    pawn.updated_at = new Date();

    await this.save({
      ...pawn,
    });

    return pawn;
  },

  async createPaymentHistoriesPayload(
    this: PawnRepository,
    pawn: Pawn,
  ): Promise<CreatePaymentHistoryDto[]> {
    const paymentHistories: CreatePaymentHistoryDto[] = [];

    const {
      interestMoney,
      contractId,
      paymentPeriod,
      paymentPeriodType,
      numOfPayment,
      loanDate,
      loanAmount,
      interestType,
      id,
      userId,
    } = pawn;

    let duration = numOfPayment;
    let skip = 0;
    let index = 1;

    const methodType =
      paymentPeriodType === PawnPaymentPeriodType.MOTH ||
      paymentPeriodType === PawnPaymentPeriodType.REGULAR_MOTH
        ? 'month'
        : 'day';

    let countPeriod = paymentPeriod;

    if (paymentPeriodType === PawnPaymentPeriodType.WEEK) {
      countPeriod = countPeriod * 7;
    }

    while (duration > 0) {
      const dates = countFromToDate(countPeriod, methodType, skip, loanDate);

      const totalDayMonth =
        paymentPeriodType === PawnPaymentPeriodType.MOTH ||
        paymentPeriodType === PawnPaymentPeriodType.REGULAR_MOTH
          ? calculateTotalDayRangeDate(dates[0], dates[1])
          : undefined;

      const interestMoneyEachPeriod = this.calculateInterestMoneyEachPeriod({
        loanAmount,
        interestMoney,
        paymentPeriod,
        interestType,
        paymentPeriodType,
        totalDayMonth,
      });

      const defaultPayload = {
        pawnId: id,
        userId,
        contractId: contractId,
        startDate: convertPostgresDate(formatDate(dates[0])),
        endDate: convertPostgresDate(formatDate(dates[1])),
        payMoney: 0,
        paymentMethod: paymentPeriodType,
        contractType: ContractType.CAM_DO,
        isRootMoney: true,
        paymentStatus: null,
      };

      if (duration === 1) {
        paymentHistories.push({
          ...defaultPayload,
          payNeed: loanAmount,
          type: PaymentHistoryType.ROOT_MONEY,
          rowId: index + 1,
        });

        paymentHistories.push({
          ...defaultPayload,
          payNeed: interestMoneyEachPeriod,
          type: PaymentHistoryType.INTEREST_MONEY,
          rowId: index,
        });
      } else {
        paymentHistories.push({
          ...defaultPayload,
          payNeed: interestMoneyEachPeriod,
          type: PaymentHistoryType.INTEREST_MONEY,
          rowId: index + 1,
        });
      }

      index++;
      duration -= 1;
      skip += countPeriod;
    }

    return paymentHistories;
  },

  calculateInterestMoneyOneDay(payload: InterestMoneyPayload): number {
    const { loanAmount, interestMoney, paymentPeriod, interestType } = payload;

    let moneyOneDay = 0;

    switch (interestType) {
      case PawnInterestType.LOAN_MIL_DAY:
        moneyOneDay = Math.round(loanAmount / 1000000) * interestMoney;
        break;
      case PawnInterestType.LOAN_DAY:
        moneyOneDay = interestMoney;
        break;
      case PawnInterestType.LOAN_PERCENT_MONTH:
        moneyOneDay = (loanAmount * (interestMoney / 100)) / 30;
        break;
      case PawnInterestType.LOAN_PERIOD:
        moneyOneDay = interestMoney / paymentPeriod;
        break;
      case PawnInterestType.LOAN_PERCENT_PERIOD:
        moneyOneDay = (loanAmount * (interestMoney / 100)) / paymentPeriod;
        break;
      case PawnInterestType.LOAN_PERCENT_WEEK:
        moneyOneDay = (loanAmount * (interestMoney / 100)) / 7;
        break;
      case PawnInterestType.LOAN_WEEK:
        moneyOneDay = interestMoney / 7;
        break;
      default:
        moneyOneDay = 0;
    }

    return moneyOneDay;
  },

  calculateInterestMoneyDayPeriod(
    this: PawnRepository,
    payload: InterestMoneyPayload,
  ): number {
    const { loanAmount, interestMoney, paymentPeriod, interestType } = payload;

    let money = 0;

    const moneyOneDay = this.calculateInterestMoneyOneDay({
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
    });

    switch (interestType) {
      case PawnInterestType.LOAN_MIL_DAY:
        money = moneyOneDay * paymentPeriod;
        break;
      case PawnInterestType.LOAN_DAY:
        money = moneyOneDay * paymentPeriod;
        break;
      case PawnInterestType.LOAN_PERCENT_MONTH:
        money = Math.round(moneyOneDay * paymentPeriod);
      case PawnInterestType.LOAN_PERIOD:
        money = paymentPeriod * moneyOneDay;
        break;
      case PawnInterestType.LOAN_PERCENT_PERIOD:
        money = paymentPeriod * moneyOneDay;
        break;
      default:
        money = 0;
    }

    return parseInt(Math.round(money).toString());
  },

  calculateInterestMoneyWeekPeriod(
    this: PawnRepository,
    payload: InterestMoneyPayload,
  ): number {
    const { loanAmount, interestMoney, paymentPeriod, interestType } = payload;

    let money = 0;

    const moneyOneDay = this.calculateInterestMoneyOneDay({
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
    });

    switch (interestType) {
      case PawnInterestType.LOAN_PERCENT_WEEK:
        money = moneyOneDay * paymentPeriod * 7;
        break;
      case PawnInterestType.LOAN_WEEK:
        money = moneyOneDay * paymentPeriod * 7;
        break;
      default:
        money = 0;
    }

    return parseInt(Math.round(money).toString());
  },

  calculateInterestMoneyMonthPeriod(
    this: PawnRepository,
    payload: InterestMoneyPayload,
  ): number {
    const {
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
      totalDayMonth,
    } = payload;

    let money = 0;

    const moneyOneDay = this.calculateInterestMoneyOneDay({
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
    });

    switch (interestType) {
      case PawnInterestType.LOAN_MIL_DAY:
        money =
          moneyOneDay * (totalDayMonth ? totalDayMonth : paymentPeriod * 30);
        break;
      case PawnInterestType.LOAN_DAY:
        money = moneyOneDay * (totalDayMonth ?? paymentPeriod * 30);
        break;
      case PawnInterestType.LOAN_PERCENT_MONTH:
        money = Math.round(moneyOneDay * (totalDayMonth ?? paymentPeriod * 30));
        break;
      default:
        money = 0;
    }

    return parseInt(Math.round(money).toString());
  },

  calculateInterestMoneyMonthRegularPeriod(
    this: PawnRepository,
    payload: InterestMoneyPayload,
  ): number {
    const {
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
      totalDayMonth,
    } = payload;

    let money = 0;

    const moneyOneDay = this.calculateInterestMoneyOneDay({
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
    });

    switch (interestType) {
      case PawnInterestType.LOAN_PERCENT_MONTH:
        money = Math.round(moneyOneDay * (totalDayMonth ?? paymentPeriod * 30));
        break;
      default:
        money = 0;
    }

    return parseInt(Math.round(money).toString());
  },

  calculateInterestMoneyEachPeriod(
    this: PawnRepository,
    payload: InterestMoneyPayload,
  ): number {
    let money = 0;

    const { paymentPeriodType } = payload;

    if (!paymentPeriodType) {
      throw new Error(
        'Không thể tính toán tiền kì lãi khi thiếu loại lãi theo kì',
      );
    }

    const omitPayload = omit(payload, ['paymentPeriodType']);

    if (paymentPeriodType === PawnPaymentPeriodType.DAY) {
      money = this.calculateInterestMoneyDayPeriod(omitPayload);
    } else if (paymentPeriodType === PawnPaymentPeriodType.WEEK) {
      money = this.calculateInterestMoneyWeekPeriod(omitPayload);
    } else if (paymentPeriodType === PawnPaymentPeriodType.MOTH) {
      money = this.calculateInterestMoneyMonthPeriod(omitPayload);
    } else if (paymentPeriodType === PawnPaymentPeriodType.REGULAR_MOTH) {
      money = this.calculateInterestMoneyMonthRegularPeriod({
        ...omitPayload,
        interestType: PawnInterestType.LOAN_PERCENT_MONTH,
      });
    }

    return money;
  },

  calculateInterestToToday(
    this: PawnRepository,
    pawn: Pawn,
  ): {
    interestDayToday;
    interestMoneyToday;
  } {
    const {
      loanDate,
      debitStatus,
      interestType,
      loanAmount,
      interestMoney,
      paymentHistories,
      paymentPeriod,
    } = pawn;

    let interestMoneyToday = 0;
    let interestDayToday = 0;
    let interestDayPaid = 0;

    const interestMoneyPaid = paymentHistories
      .filter((paymentHistory) => !paymentHistory.isRootMoney)
      .reduce((total, paymentHistory) => {
        if (
          paymentHistory.paymentStatus === PaymentStatusHistory.FINISH &&
          paymentHistory.type === PaymentHistoryType.INTEREST_MONEY
        ) {
          return total + paymentHistory.payMoney;
        }

        return total;
      }, 0);

    if (debitStatus === DebitStatus.COMPLETED) {
      return { interestDayToday, interestMoneyToday };
    }

    const todayTime = new Date().setHours(0, 0, 0, 0);
    const loanDateTime = new Date(loanDate).setHours(0, 0, 0, 0);

    const interestMoneyOneDay = this.calculateInterestMoneyOneDay({
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
    });

    interestDayPaid = interestMoneyPaid / interestMoneyOneDay;

    const rangeDayToToday = Math.round((todayTime - loanDateTime) / 86400000);

    if (rangeDayToToday - interestDayPaid > 0) {
      interestDayToday = rangeDayToToday - interestDayPaid;
      interestMoneyToday = interestDayToday * interestMoneyOneDay;
    }

    return { interestDayToday, interestMoneyToday };
  },

  calculateLateAndBadPayment(pawn: Pawn): {
    latePaymentPeriod;
    latePaymentMoney;
    badDebitMoney;
    isFinishPaymentPeriod;
  } {
    let latePaymentPeriod = 0;
    let latePaymentMoney = 0;
    let badDebitMoney = 0;
    let isFinishPaymentPeriod = false;

    const { debitStatus } = pawn;
    const paymentHistories = pawn.paymentHistories ?? [];

    const today = formatDate(new Date());

    const sortPaymentHistories = paymentHistories.sort(
      (p1, p2) => p1.rowId - p2.rowId,
    );

    const lastPaymentHistoryPeriodUnFinish = sortPaymentHistories.find(
      (paymentHistory) => isLastPaymentHistoryPeriodUnFinish(paymentHistory),
    );

    if (lastPaymentHistoryPeriodUnFinish) {
      latePaymentPeriod = sortPaymentHistories.reduce(
        (total, paymentHistory) => {
          if (isLastPaymentHistoryPeriodUnFinish(paymentHistory)) {
            return total + 1;
          }
          return total;
        },
        0,
      );

      latePaymentMoney = sortPaymentHistories.reduce(
        (total, paymentHistory) => {
          if (isLastPaymentHistoryPeriodUnFinish(paymentHistory)) {
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

    const paymentHistoryFinishToday = paymentHistories.find(
      (paymentHistory) =>
        paymentHistory.paymentStatus == PaymentStatusHistory.FINISH &&
        formatDate(paymentHistory.startDate) == today,
    );

    if (paymentHistoryFinishToday) {
      isFinishPaymentPeriod = true;
    }

    return {
      latePaymentPeriod,
      latePaymentMoney,
      badDebitMoney,
      isFinishPaymentPeriod,
    };
  },

  async updateRevenueReceived(this: PawnRepository, id: string): Promise<Pawn> {
    const pawn = await this.checkPawnExist(
      { where: [{ id }, { contractId: id }], relations: ['paymentHistories'] },
      { message: 'Không tìm thấy hợp đồng' },
    );

    const revenueReceived = pawn.paymentHistories.reduce(
      (total, paymentHistory) => paymentHistory.payNeed + total,
      0,
    );

    pawn.revenueReceived = revenueReceived;

    await this.save({ ...pawn });

    return pawn;
  },

  mapPawnResponse(
    this: PawnRepository,
    pawn: Pawn | null,
  ): PawnResponseDto | null {
    if (pawn) {
      const paymentHistories = pawn.paymentHistories;

      const moneyOnePeriod =
        paymentHistories.find((paymentHistory) => !paymentHistory.isRootMoney)
          ?.payNeed ?? 0;

      const moneyPaidNumber = paymentHistories.reduce(
        (total, paymentHistory) => {
          if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
            return (total += paymentHistory.payMoney);
          }
          return total;
        },
        0,
      );

      const { latePaymentMoney, latePaymentPeriod, badDebitMoney } =
        this.calculateLateAndBadPayment(pawn);

      const { interestDayToday, interestMoneyToday } =
        this.calculateInterestToToday(pawn);

      return {
        ...pawn,
        moneyPaid: moneyPaidNumber,
        loanDate: formatDate(pawn.loanDate),
        moneyOnePeriod,
        latePaymentMoney,
        latePaymentPeriod,
        badDebitMoney,
        interestDayToday,
        interestMoneyToday,
      } as PawnResponseDto;
    }

    return null;
  },

  async listPawn(
    this: PawnRepository,
    options: FindManyOptions<Pawn>,
  ): Promise<{ list_pawn: PawnResponseDto[]; total: number }> {
    const pawnData = await this.findAndCount(options);

    const list_pawn = await Promise.all(
      pawnData[0].map(async (pawn) => {
        return await this.getPawn({
          where: { id: pawn.id },
          relations: PAWN_RELATIONS,
        });
      }),
    );

    return { list_pawn, total: pawnData[1] };
  },

  async getPawn(
    this: PawnRepository,
    options: FindOneOptions<Pawn>,
  ): Promise<PawnResponseDto> {
    const batHo = await this.checkPawnExist(
      options,
      { message: 'Không tìm thấy hợp đồng' },
      false,
    );

    return this.mapPawnResponse(batHo);
  },

  getRelations(excludes: string[]): string[] {
    return PAWN_RELATIONS.filter((relation) => !excludes.includes(relation));
  },

  async updateStatus(this: PawnRepository, id: string): Promise<void> {
    const pawn = await this.findOne({
      where: [{ id }, { contractId: id }],
      relations: ['paymentHistories'],
    });

    if (pawn) {
      const paymentHistories = pawn.paymentHistories ?? [];

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
          formatDate(lastPaymentHistory?.endDate ?? new Date()),
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
        pawn.debitStatus = DebitStatus.COMPLETED;
      }

      if (!isNotNull) {
        pawn.debitStatus = DebitStatus.BAD_DEBIT;
      }

      if ((todayTime - lastTime) / 86400000 >= 1) {
        pawn.debitStatus = DebitStatus.BAD_DEBIT;
      } else {
        const notFinishPaymentHistory = sortPaymentHistories.find(
          (paymentHistory) =>
            paymentHistory.paymentStatus !== PaymentStatusHistory.FINISH &&
            formatDate(paymentHistory.endDate) !== today &&
            new Date(paymentHistory.endDate).getTime() <
              new Date(convertPostgresDate(today)).getTime(),
        );

        if (notFinishPaymentHistory) {
          const timeNot = new Date(
            convertPostgresDate(
              formatDate(notFinishPaymentHistory?.endDate ?? new Date()),
            ),
          ).getTime();

          if (timeNot > lastTime) {
            pawn.debitStatus = DebitStatus.BAD_DEBIT;
          } else {
            pawn.debitStatus = DebitStatus.LATE_PAYMENT;
          }
        }
      }

      pawn.debitStatus = DebitStatus.IN_DEBIT;
    }

    await this.save({ ...pawn });
  },
};
