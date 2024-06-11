import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CashFilterType, ContractType } from 'src/common/interface';
import { DebitStatus, ServiceFee } from 'src/common/interface/bat-ho';
import {
  PaymentHistoryType,
  PaymentStatusHistory,
  TransactionHistoryType,
} from 'src/common/interface/history';
import {
  LoanMoreMoney,
  LoanMoreMoneyHistory,
  PawnExtendPeriod,
  PawnInterestType,
  PawnPaymentPeriodType,
  PaymentDownRootMoney,
  PaymentDownRootMoneyHistory,
  SettlementPawn,
} from 'src/common/interface/pawn';
import { BaseService } from 'src/common/service/base.service';
import { calculateInterestToTodayPawn } from 'src/common/utils/calculate';
import { getFullName } from 'src/common/utils/get-full-name';
import { calculateTotalMoneyPaymentHistory } from 'src/common/utils/history';
import {
  calculateTotalDayRangeDate,
  convertPostgresDate,
  countFromToDate,
  formatDate,
  getDateLocal,
  getTodayNotTimeZone,
} from 'src/common/utils/time';
import { ContractService } from 'src/contract/contract.service';
import { DatabaseService } from 'src/database/database.service';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { CreatePaymentHistoryDto } from 'src/payment-history/dto/create-payment-history';
import {
  DataSource,
  EntityManager,
  Equal,
  FindManyOptions,
  FindOneOptions,
  IsNull,
  Not,
  Or,
  Repository,
} from 'typeorm';
import { PawnPaymentType } from './../common/interface/profit';
import { CreatePawnDto } from './dto/create-pawn.dto';
import { ExtendedPeriodConfirmDto } from './dto/extended-period-confirm.dto';
import { LoanMoreMoneyDto } from './dto/loan-more-money.dto';
import { PaymentDownRootMoneyDto } from './dto/payment-down-root-money.dto';
import { SettlementPawnDto } from './dto/settlement-pawn.dto';
import { UpdatePawnDto } from './dto/update-pawn.dto';
import { Pawn } from './pawn.entity';

@Injectable()
export class PawnService extends BaseService<
  Pawn,
  CreatePawnDto,
  UpdatePawnDto
> {
  protected manager: EntityManager;
  private pawnRepository: Repository<Pawn>;
  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
    private contractService: ContractService,
    private logger: LoggerServerService,
  ) {
    super();
    this.manager = this.dataSource.manager;
    this.pawnRepository = this.dataSource.manager.getRepository(Pawn);
  }

  async create(payload: CreatePawnDto): Promise<Pawn> {
    const { customerId, userId } = payload;

    const newPawn = await this.databaseService.runTransaction(
      async (repositories) => {
        const {
          pawnRepository,
          customerRepository,
          paymentHistoryRepository,
          transactionHistoryRepository,
          cashRepository,
        } = repositories;

        let payloadData = {
          ...payload,
          customer: undefined,
          loanDate: convertPostgresDate(payload.loanDate),
          debitStatus: payload.debitStatus ?? DebitStatus.IN_DEBIT,
        };

        if (customerId) {
          const findCustomer = await customerRepository.checkCustomerExist(
            { where: { id: customerId } },
            { message: 'Không tìm thấy khách hàng.' },
          );

          payload.customer = findCustomer;
        } else {
          const newCustomer = await customerRepository.createCustomer({
            ...payload.customer,
          });

          payloadData = { ...payloadData, customerId: newCustomer.id };
        }

        const pawnContract = await pawnRepository.findOne({
          where: { contractId: payload.contractId },
        });

        if (pawnContract) {
          throw new BadRequestException('Mã hợp đồng đã tồn tại.');
        }

        let newPawn = await pawnRepository.create({
          ...payloadData,
          userId,
          paymentType: payloadData.paymentType ?? PawnPaymentType.AFTER,
        });

        newPawn = await pawnRepository.save(newPawn);

        const paymentHistories = await this.countPawnPaymentHistory(
          newPawn,
          userId,
        );

        const newPaymentHistories = await Promise.all(
          paymentHistories.map(async (paymentHistory) => {
            let newPaymentHistory =
              await paymentHistoryRepository.create(paymentHistory);
            newPaymentHistory =
              await paymentHistoryRepository.save(newPaymentHistory);
            return newPaymentHistory;
          }),
        );

        const revenueReceived = newPaymentHistories.reduce(
          (total, paymentHistory) => {
            return total + paymentHistory.payNeed;
          },
          0,
        );

        const lastPaymentHistory =
          newPaymentHistories[newPaymentHistories.length - 1];

        await pawnRepository.update(
          { id: newPawn.id },
          {
            revenueReceived,
            finishDate: lastPaymentHistory.endDate,
          },
        );

        const pawn = await pawnRepository.findOne({
          where: { id: newPawn.id },
          relations: ['customer', 'user'],
        });

        await cashRepository.createCashContract(
          { pawn },
          CashFilterType.PAYMENT_CONTRACT,
          { amount: payload.loanAmount },
        );

        await cashRepository.createCashContract(
          { pawn },
          CashFilterType.RECEIPT_CONTRACT,
          { amount: 0 },
        );

        await transactionHistoryRepository.createPayloadAndSave({
          contract: { pawn: newPawn },
          type: TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT,
          money: newPawn.loanAmount,
          otherMoney: 0,
          createdAt: newPawn.loanDate,
        });

        return newPawn;
      },
    );

    await this.contractService.updatePawnStatus(newPawn.id);

    return newPawn;
  }

  async update(id: string, payload: UpdatePawnDto): Promise<any> {
    const pawnUpdated = await this.databaseService.runTransaction(
      async (repositories) => {
        const {
          pawnRepository,
          cashRepository,
          paymentHistoryRepository,
          transactionHistoryRepository,
        } = repositories;

        const pawn = await pawnRepository.findOne({
          where: [{ id }, { contractId: id }],
        });

        if (!pawn) {
          throw new Error('Không tìm thấy hợp đồng');
        }

        if (payload.debitStatus && payload.debitStatus !== pawn.debitStatus) {
          const values = Object.values(DebitStatus);
          const isDebitStatus = values.find(
            (val) => val == payload.debitStatus,
          );
          if (!isDebitStatus) {
            throw new Error('Trạng thái không hợp lệ.');
          }
        }

        if (payload.contractId && payload.contractId !== pawn.contractId) {
          const pawnContractId = await this.pawnRepository.findOne({
            where: [{ contractId: payload.contractId }],
          });

          if (pawnContractId && pawn.id !== pawnContractId.id) {
            throw new Error('Mã hợp đồng đã tồn tại');
          }
        }

        if (payload.loanAmount && payload.loanAmount !== pawn.loanAmount) {
          await cashRepository.update(
            {
              pawnId: pawn.id,
              filterType: CashFilterType.PAYMENT_CONTRACT,
            },
            { amount: payload.loanAmount },
          );
        }

        const pawnLoanDate = formatDate(pawn.loanDate);

        const isUpdateLoanDate =
          payload.loanDate && pawnLoanDate !== payload.loanDate;

        const isUpdateInterestType =
          payload.interestType && pawn.interestMoney !== payload.interestMoney;

        const isUpdateInterestMoney =
          payload.interestMoney && pawn.interestMoney !== payload.interestMoney;

        const isUpdatePaymentPeriod =
          payload.paymentPeriod && pawn.paymentPeriod !== payload.paymentPeriod;

        const isUpdatePaymentPeriodType =
          payload.paymentPeriodType &&
          pawn.paymentPeriodType !== payload.paymentPeriodType;

        const isUpdateNumOfPayment =
          payload.numOfPayment && pawn.numOfPayment !== payload.numOfPayment;

        if (
          isUpdateLoanDate ||
          isUpdateInterestMoney ||
          isUpdateInterestType ||
          isUpdatePaymentPeriod ||
          isUpdatePaymentPeriodType ||
          isUpdateNumOfPayment
        ) {
          pawn.loanDate = convertPostgresDate(payload.loanDate);
          pawn.interestMoney = payload.interestMoney;
          pawn.interestType = payload.interestType;
          pawn.numOfPayment = payload.numOfPayment;
          pawn.paymentPeriod = payload.paymentPeriod;
          pawn.paymentPeriodType = payload.paymentPeriodType;

          await paymentHistoryRepository.delete({ pawnId: pawn.id });

          await transactionHistoryRepository.delete({ pawnId: pawn.id });

          const paymentHistories = await this.countPawnPaymentHistory(
            pawn,
            pawn.userId,
          );

          const newPaymentHistories = await Promise.all(
            paymentHistories.map(async (paymentHistory) => {
              let newPaymentHistory =
                await paymentHistoryRepository.create(paymentHistory);
              newPaymentHistory =
                await paymentHistoryRepository.save(newPaymentHistory);
              return newPaymentHistory;
            }),
          );

          const revenueReceived = newPaymentHistories.reduce(
            (total, paymentHistory) => {
              return total + paymentHistory.payNeed;
            },
            0,
          );

          await pawnRepository.update({ id: pawn.id }, { revenueReceived });

          await cashRepository.update(
            { pawnId: pawn.id, filterType: CashFilterType.RECEIPT_CONTRACT },
            {
              amount: 0,
              contractId: payload.contractId,
              contractStatus: pawn.debitStatus,
            },
          );

          await transactionHistoryRepository.createPayloadAndSave({
            contract: { pawn },
            type: TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT,
            money: pawn.loanAmount,
            otherMoney: 0,
            createdAt: pawn.loanDate,
          });
        }

        await this.pawnRepository.save({
          ...pawn,
          ...payload,
          loanDate: convertPostgresDate(payload.loanDate),
        });

        return pawn;
      },
    );

    await this.contractService.updatePawnStatus(pawnUpdated.id);

    return pawnUpdated;
  }

  async delete(id: string): Promise<any> {
    const pawn = await this.pawnRepository.findOne({
      where: [{ id }, { contractId: id }],
    });

    if (!pawn) {
      throw new Error('Không tìm thấy hợp đồng');
    }

    return await this.pawnRepository.save({
      ...pawn,
      deleted_at: new Date(),
    });
  }

  async remove(id: string): Promise<any> {
    const pawn = await this.pawnRepository.findOne({
      where: [{ id }, { contractId: id }],
    });

    if (!pawn) {
      throw new Error('Không tìm thấy hợp đồng');
    }

    return await this.pawnRepository.delete({
      id: pawn.id,
    });
  }

  async list(options: FindManyOptions<Pawn>): Promise<Pawn[]> {
    throw new Error('Method not implemented.');
    console.log(options);
  }

  async listAndCount(
    options: FindManyOptions<Pawn>,
  ): Promise<[Pawn[], number]> {
    return await this.pawnRepository.findAndCount(options);
  }

  async retrieveById(id: string): Promise<Pawn> {
    throw new Error('Method not implemented.');
    console.log(id);
  }

  async retrieveOne(options: FindOneOptions<Pawn>): Promise<Pawn> {
    return await this.pawnRepository.findOne(options);
  }

  async updateRevenue(id: string) {
    await this.databaseService.runTransaction(async (repositories) => {
      const { pawnRepository } = repositories;

      const pawn = await pawnRepository.findOne({
        where: { id },
        relations: ['paymentHistories', 'customer', 'user'],
      });

      if (pawn) {
        const paymentHistoryMoney = pawn.paymentHistories.reduce(
          (total, paymentHistory) => {
            if (!paymentHistory.isRootMoney) {
              return paymentHistory.payNeed + total;
            }
            return total;
          },
          0,
        );

        await pawnRepository.update(
          { id: pawn.id },
          {
            revenueReceived: pawn.loanAmount + paymentHistoryMoney,
          },
        );
      }
    });
  }

  async countPawnPaymentHistory(
    pawn: Pawn,
    userId: string,
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

      const interestMoneyEachPeriod = this.countInterestMoneyEachPeriod(
        loanAmount,
        interestMoney,
        paymentPeriod,
        interestType,
        paymentPeriodType,
        totalDayMonth,
      );

      if (duration === 1) {
        paymentHistories.push({
          rowId: index + 1,
          pawnId: id,
          userId,
          contractId: contractId,
          startDate: convertPostgresDate(formatDate(dates[0])),
          endDate: convertPostgresDate(formatDate(dates[1])),
          paymentMethod: paymentPeriodType,
          payMoney: 0,
          payNeed: loanAmount,
          paymentStatus: null,
          contractType: ContractType.CAM_DO,
          isRootMoney: true,
          type: PaymentHistoryType.ROOT_MONEY,
        });
        paymentHistories.push({
          rowId: index,
          pawnId: id,
          userId,
          contractId: contractId,
          startDate: convertPostgresDate(formatDate(dates[0])),
          endDate: convertPostgresDate(formatDate(dates[1])),
          paymentMethod: paymentPeriodType,
          payMoney: 0,
          payNeed: interestMoneyEachPeriod,
          paymentStatus: null,
          contractType: ContractType.CAM_DO,
          type: PaymentHistoryType.INTEREST_MONEY,
        });
      } else {
        paymentHistories.push({
          rowId: index + 1,
          pawnId: id,
          userId,
          contractId: contractId,
          startDate: convertPostgresDate(formatDate(dates[0])),
          endDate: convertPostgresDate(formatDate(dates[1])),
          paymentMethod: paymentPeriodType,
          payMoney: 0,
          payNeed: interestMoneyEachPeriod,
          paymentStatus: null,
          contractType: ContractType.CAM_DO,
          type: PaymentHistoryType.INTEREST_MONEY,
        });
      }

      index++;
      duration -= 1;
      skip += countPeriod;
    }

    return paymentHistories;
  }

  private calculateInterestMoneyOfOneDay(
    loanAmount: number,
    interestMoney: number,
    paymentPeriod: number,
    interestType: string,
  ) {
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
  }

  calculateInterestMoneyWithDay(
    loanAmount: number,
    interestMoney: number,
    paymentPeriod: number,
    interestType: string,
  ) {
    let money = 0;

    const moneyOneDay = this.calculateInterestMoneyOfOneDay(
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
    );

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
  }

  calculateInterestMoneyWithWeek(
    loanAmount: number,
    interestMoney: number,
    paymentPeriod: number,
    interestType: string,
  ) {
    let money = 0;

    const moneyOneDay = this.calculateInterestMoneyOfOneDay(
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
    );

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
  }

  calculateInterestMoneyWithMonth(
    loanAmount: number,
    interestMoney: number,
    paymentPeriod: number,
    interestType: string,
    totalDayMonth?: number,
  ) {
    let money = 0;

    const moneyOneDay = this.calculateInterestMoneyOfOneDay(
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
    );

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
  }

  calculateInterestMoneyWithMonthRegular(
    loanAmount: number,
    interestMoney: number,
    paymentPeriod: number,
    interestType: string,
    totalDayMonth?: number,
  ) {
    let money = 0;

    const moneyOneDay = this.calculateInterestMoneyOfOneDay(
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
    );

    switch (interestType) {
      case PawnInterestType.LOAN_PERCENT_MONTH:
        money = Math.round(moneyOneDay * (totalDayMonth ?? paymentPeriod * 30));
        break;
      default:
        money = 0;
    }

    return parseInt(Math.round(money).toString());
  }

  countInterestMoneyEachPeriod(
    loanAmount: number,
    interestMoney: number,
    paymentPeriod: number,
    interestType: string,
    paymentPeriodType: string,
    totalDayMonth?: number,
  ) {
    let money = 0;

    if (paymentPeriodType === PawnPaymentPeriodType.DAY) {
      money = this.calculateInterestMoneyWithDay(
        loanAmount,
        interestMoney,
        paymentPeriod,
        interestType,
      );
    } else if (paymentPeriodType === PawnPaymentPeriodType.WEEK) {
      money = this.calculateInterestMoneyWithWeek(
        loanAmount,
        interestMoney,
        paymentPeriod,
        interestType,
      );
    } else if (paymentPeriodType === PawnPaymentPeriodType.MOTH) {
      money = this.calculateInterestMoneyWithMonth(
        loanAmount,
        interestMoney,
        paymentPeriod,
        interestType,
        totalDayMonth,
      );
    } else if (paymentPeriodType === PawnPaymentPeriodType.REGULAR_MOTH) {
      money = this.calculateInterestMoneyWithMonthRegular(
        loanAmount,
        interestMoney,
        paymentPeriod,
        PawnInterestType.LOAN_PERCENT_MONTH,
        totalDayMonth,
      );
    }

    return money;
  }

  async settlementRequest(id: string) {
    const pawn = await this.pawnRepository.findOne({
      where: { id },
      relations: ['paymentHistories', 'customer'],
    });

    if (!pawn) {
      throw new Error('Không tìm thấy hợp đồng');
    }

    const {
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
      loanDate,
      paymentHistories,
    } = pawn;

    const interestMoneyOneDay = this.calculateInterestMoneyOfOneDay(
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
    );

    const today = getTodayNotTimeZone();

    const totalDayToToday = calculateTotalDayRangeDate(
      new Date(new Date(loanDate).setHours(0, 0, 0, 0)),
      today,
    );

    const interestMoneyTotal = totalDayToToday * interestMoneyOneDay;

    const rootPaymentHistory = paymentHistories.find(
      (paymentHistory) => paymentHistory.type === PaymentHistoryType.ROOT_MONEY,
    );

    const moneyPaid = paymentHistories.reduce((total, paymentHistory) => {
      if (
        paymentHistory.paymentStatus === PaymentStatusHistory.FINISH &&
        paymentHistory.type === PaymentHistoryType.INTEREST_MONEY
      ) {
        return total + paymentHistory.payMoney;
      }
      return total;
    }, 0);

    const settlementMoney =
      rootPaymentHistory?.payNeed + interestMoneyTotal - moneyPaid;

    const totalMoney = calculateTotalMoneyPaymentHistory(
      paymentHistories ?? [],
    );

    const settlementPawn: SettlementPawn = {
      paymentHistories: paymentHistories.map((paymentHistory) => ({
        ...paymentHistory,
        paymentDate: paymentHistory.endDate,
      })),
      contractInfo: {
        contractId: pawn.contractId,
        loanAmount,
        interestRate: `${pawn.interestType}`,
        contractType: 'Cầm Đồ',
        loanDate: `${formatDate(loanDate)}-${formatDate(paymentHistories[paymentHistories.length - 1].endDate)}`,
        totalMoneyMustPay: loanAmount + interestMoneyTotal,
        moneyPaid,
        moneyMustReceipt: settlementMoney,
        interestDay: totalDayToToday,
        note: pawn.noteContract,
        interestMoney: pawn.interestMoney,
      },
      settlementInfo: {
        settlementMoney,
        paymentDate: formatDate(today),
        customer: getFullName(
          pawn.customer?.firstName,
          pawn.customer?.lastName,
        ),
        serviceFee: (pawn.serviceFee ?? []) as ServiceFee[],
      },
      totalMoney,
    };

    return settlementPawn;
  }

  async settlementChange(id: string, paymentDate: string) {
    const pawn = await this.pawnRepository.findOne({
      where: { id },
      relations: ['paymentHistories', 'customer'],
    });

    if (!pawn) {
      throw new Error('Không tìm thấy hợp đồng');
    }

    const today = getTodayNotTimeZone();
    const paymentDateTime = new Date(convertPostgresDate(paymentDate)).setHours(
      0,
      0,
      0,
    );
    const loanDateTime = new Date(pawn.loanDate).setHours(0, 0, 0);

    if (today.getTime() < paymentDateTime) {
      throw new Error('Thời gian tất toán không được lớn hơn hôm nay');
    }

    if (paymentDateTime < loanDateTime) {
      throw new Error('Thời gian tất toán không được nhỏ hơn ngày vay');
    }

    const {
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
      loanDate,
      paymentHistories,
    } = pawn;

    const interestMoneyOneDay = this.calculateInterestMoneyOfOneDay(
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
    );

    const totalDayToToday = calculateTotalDayRangeDate(
      new Date(paymentDate),
      today,
    );

    const interestMoneyTotal = totalDayToToday * interestMoneyOneDay;

    const moneyPaid = paymentHistories.reduce((total, paymentHistory) => {
      if (
        paymentHistory.paymentStatus === PaymentStatusHistory.FINISH &&
        paymentHistory.type === PaymentHistoryType.INTEREST_MONEY
      ) {
        return total + paymentHistory.payMoney;
      }
      return total;
    }, 0);

    const rootPaymentHistory = paymentHistories.find(
      (paymentHistory) => paymentHistory.type === PaymentHistoryType.ROOT_MONEY,
    );

    const settlementMoney =
      rootPaymentHistory.payNeed + interestMoneyTotal - moneyPaid;

    const totalMoney = calculateTotalMoneyPaymentHistory(
      paymentHistories ?? [],
    );

    const settlementPawn: SettlementPawn = {
      paymentHistories,
      contractInfo: {
        contractId: pawn.contractId,
        loanAmount,
        interestRate: `${pawn.interestType}`,
        contractType: 'Cầm Đồ',
        loanDate: `${formatDate(loanDate)}-${formatDate(paymentHistories[paymentHistories.length - 1].endDate)}`,
        totalMoneyMustPay: loanAmount + interestMoneyTotal,
        moneyPaid,
        moneyMustReceipt: settlementMoney,
        interestDay: totalDayToToday,
        note: pawn.noteContract,
        interestMoney: pawn.interestMoney,
      },
      settlementInfo: {
        settlementMoney,
        paymentDate: formatDate(today),
        customer: getFullName(
          pawn.customer?.firstName,
          pawn.customer?.lastName,
        ),
        serviceFee: (pawn.serviceFee ?? []) as ServiceFee[],
      },
      totalMoney,
    };

    return settlementPawn;
  }

  async settlementConfirm(id: string, payload: SettlementPawnDto) {
    const pawn = await this.pawnRepository.findOne({
      where: { id },
      relations: ['paymentHistories', 'customer', 'user'],
    });

    if (!pawn) {
      throw new Error('Không tìm thấy hợp đồng');
    }

    const { paymentDate, settlementMoney, serviceFee } = payload;

    const today = getTodayNotTimeZone();
    const paymentDateTime = new Date(convertPostgresDate(paymentDate)).setHours(
      0,
      0,
      0,
    );

    if (today.getTime() < paymentDateTime) {
      throw new Error('Thời gian tất toán không được lớn hơn hôm nay');
    }

    const {
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
      paymentHistories,
    } = pawn;

    const interestMoneyOneDay = this.calculateInterestMoneyOfOneDay(
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
    );

    const totalDayToToday = calculateTotalDayRangeDate(
      new Date(convertPostgresDate(paymentDate)),
      today,
    );

    const interestMoneyTotal = totalDayToToday * interestMoneyOneDay;

    const moneyPaid = paymentHistories.reduce((total, paymentHistory) => {
      if (
        paymentHistory.paymentStatus === PaymentStatusHistory.FINISH &&
        paymentHistory.type === PaymentHistoryType.INTEREST_MONEY
      ) {
        return total + paymentHistory.payMoney;
      }
      return total;
    }, 0);

    const rootPaymentHistory = paymentHistories.find(
      (paymentHistory) => paymentHistory.type === PaymentHistoryType.ROOT_MONEY,
    );

    const settlementMoneyExpected =
      rootPaymentHistory.payNeed + interestMoneyTotal - moneyPaid;

    if (settlementMoney < settlementMoneyExpected) {
      throw new Error(`Số tiền đóng không được nhỏ hơn số tiền còn phải thu`);
    }

    let feeServiceTotal = 0;

    if (serviceFee) {
      feeServiceTotal = serviceFee.reduce((total, fee) => total + fee.value, 0);
    }

    await this.databaseService.runTransaction(async (repositories) => {
      const {
        cashRepository,
        transactionHistoryRepository,
        pawnRepository,
        paymentHistoryRepository,
      } = repositories;

      const cash = await cashRepository.findOne({
        where: {
          contractId: pawn.contractId,
          filterType: CashFilterType.RECEIPT_CONTRACT,
        },
      });

      cash.amount = settlementMoney + feeServiceTotal;

      await cashRepository.save(cash);

      await transactionHistoryRepository.createPayloadAndSave({
        contract: { pawn },
        type: TransactionHistoryType.SETTLEMENT_CONTRACT,
        money: settlementMoney,
        otherMoney: feeServiceTotal,
        createdAt: getDateLocal(
          new Date(convertPostgresDate(payload.paymentDate)),
        ),
      });

      await pawnRepository.update(
        { id: pawn.id },
        {
          debitStatus: DebitStatus.COMPLETED,
          settlementDate: convertPostgresDate(paymentDate),
          serviceFee,
        },
      );

      await paymentHistoryRepository.update(
        { id: rootPaymentHistory.id },
        {
          paymentStatus: PaymentStatusHistory.FINISH,
          payMoney: rootPaymentHistory.payNeed,
        },
      );

      await paymentHistoryRepository.createPaymentHistory({
        rowId: paymentHistories.length + 1,
        pawnId: id,
        payMoney: settlementMoney - rootPaymentHistory.payNeed,
        payNeed: settlementMoney - rootPaymentHistory.payNeed,
        startDate: convertPostgresDate(payload.paymentDate),
        endDate: convertPostgresDate(payload.paymentDate),
        type: PaymentHistoryType.INTEREST_MONEY,
        paymentStatus: PaymentStatusHistory.FINISH,
        contractType: ContractType.CAM_DO,
        paymentMethod: pawn.paymentPeriodType,
        contractId: pawn.contractId,
        userId: pawn.userId,
      });
    });

    return true;
  }

  async paymentDownRootMoneyRequest(id: string) {
    const { transactionHistoryRepository } =
      await this.databaseService.getRepositories();

    const pawn = await this.pawnRepository.findOne({
      where: { id },
      relations: ['paymentHistories', 'customer', 'user'],
    });

    if (!pawn) {
      throw new Error('Không tìm thấy hợp đồng');
    }

    const { paymentHistories } = pawn;

    const transactionHistories = await transactionHistoryRepository.find({
      where: {
        pawnId: pawn.id,
        type: Equal(TransactionHistoryType.PAYMENT_DOWN_ROOT_MONEY),
      },
    });

    const transactionHistoriesMap: PaymentDownRootMoneyHistory[] =
      transactionHistories.map((transactionHistory) => ({
        customer: getFullName(
          pawn.customer?.firstName,
          pawn.customer?.lastName,
        ),
        paymentDate: formatDate(transactionHistory.created_at),
        paymentMoney: transactionHistory.moneyAdd,
        ortherFee: transactionHistory.otherMoney,
        note: transactionHistory.note,
      }));

    const totalMoney = calculateTotalMoneyPaymentHistory(
      paymentHistories ?? [],
    );

    const paymentDownRootMoney: PaymentDownRootMoney = {
      paymentHistories: paymentHistories.map((paymentHistory) => ({
        ...paymentHistory,
        paymentDate: paymentHistory.endDate,
      })),
      transactionHistories: [...transactionHistoriesMap],
      contractInfo: {
        contractId: pawn.contractId,
        customer: getFullName(
          pawn.customer?.firstName,
          pawn.customer?.lastName,
        ),
        birthdayDate: formatDate(pawn.customer?.dateOfBirth),
        address: pawn.customer?.address,
        loanAmount: pawn.loanAmount,
        loanDate: formatDate(pawn.loanDate),
        interestRate: pawn.interestType,
        contractType: 'Cầm đồ',
        interestMoney: pawn.interestMoney,
      },
      customer: pawn.customer ?? {},
      totalMoney,
    };

    return paymentDownRootMoney;
  }

  async paymentDownRootMoneyConfirm(
    id: string,
    payload: PaymentDownRootMoneyDto,
  ) {
    const pawn = await this.pawnRepository.findOne({
      where: { id },
      relations: ['paymentHistories', 'customer', 'user'],
    });

    if (!pawn) {
      throw new Error('Không tìm thấy hợp đồng');
    }

    await this.databaseService.runTransaction(async (repositories) => {
      const {
        paymentPeriodType,
        interestMoney,
        interestType,
        paymentPeriod,
        id,
        paymentHistories: pawnPaymentHistories,
      } = pawn;

      const {
        paymentHistoryRepository,
        transactionHistoryRepository,
        cashRepository,
        pawnRepository,
      } = repositories;

      const paymentHistories = await paymentHistoryRepository.find({
        where: {
          pawnId: id,
          paymentStatus: Or(Equal(PaymentStatusHistory.UNFINISH), IsNull()),
        },
      });

      const rootMoney =
        (paymentHistories.find((paymentHistory) => paymentHistory.isRootMoney)
          ?.payNeed ?? 0) - payload.paymentMoney;

      const sortPaymentHistories = paymentHistories
        .filter(
          (paymentHistory) =>
            !(
              [
                PaymentHistoryType.DEDUCTION_MONEY,
                PaymentHistoryType.DOWN_ROOT_MONEY,
                PaymentHistoryType.LOAN_MORE_MONEY,
                PaymentHistoryType.OTHER_MONEY_DOWN_ROOT,
                PaymentHistoryType.OTHER_MONEY_LOAN_MORE,
              ] as string[]
            ).includes(paymentHistory.type),
        )
        .sort((p1, p2) => p1.rowId - p2.rowId);

      await Promise.all(
        sortPaymentHistories.map(async (paymentHistory) => {
          const totalDayMonth =
            paymentPeriodType === PawnPaymentPeriodType.MOTH ||
            paymentPeriodType === PawnPaymentPeriodType.REGULAR_MOTH
              ? calculateTotalDayRangeDate(
                  new Date(paymentHistory.startDate),
                  new Date(paymentHistory.endDate),
                )
              : undefined;

          const interestMoneyEachPeriod = this.countInterestMoneyEachPeriod(
            rootMoney,
            interestMoney,
            paymentPeriod,
            interestType,
            paymentPeriodType,
            totalDayMonth,
          );

          if (paymentHistory.isRootMoney) {
            await paymentHistoryRepository.update(
              { id: paymentHistory.id },
              {
                payNeed: rootMoney,
                payMoney: paymentHistory.payMoney + payload.paymentMoney,
              },
            );
          } else {
            await paymentHistoryRepository.update(
              { id: paymentHistory.id },
              {
                payNeed: interestMoneyEachPeriod,
              },
            );
          }
        }),
      );

      if (payload.otherMoney) {
        await paymentHistoryRepository.createPaymentHistory({
          rowId: pawnPaymentHistories.length + 2,
          pawnId: id,
          payMoney: payload.otherMoney,
          payNeed: payload.otherMoney,
          startDate: convertPostgresDate(payload.paymentDate),
          endDate: convertPostgresDate(payload.paymentDate),
          type: PaymentHistoryType.OTHER_MONEY_DOWN_ROOT,
          paymentStatus: PaymentStatusHistory.FINISH,
          contractType: ContractType.CAM_DO,
          paymentMethod: pawn.paymentPeriodType,
          contractId: pawn.contractId,
          userId: pawn.userId,
        });
      }

      await transactionHistoryRepository.createPayloadAndSave({
        contract: { pawn },
        type: TransactionHistoryType.PAYMENT_DOWN_ROOT_MONEY,
        money: payload.paymentMoney,
        otherMoney: payload.otherMoney,
        createdAt: getDateLocal(
          new Date(convertPostgresDate(payload.paymentDate)),
        ),
      });

      await cashRepository.createCashContract(
        { pawn },
        CashFilterType.PAYMENT_CONTRACT,
        { amount: payload.paymentMoney + payload.otherMoney },
      );

      await pawnRepository.update(
        { id: pawn.id },
        { loanAmount: pawn.loanAmount - payload.paymentMoney },
      );
    });

    await this.updateRevenue(pawn.id);

    return true;
  }

  async loanMoreMoneyRequest(id: string) {
    const { transactionHistoryRepository } =
      await this.databaseService.getRepositories();

    const pawn = await this.pawnRepository.findOne({
      where: { id },
      relations: ['paymentHistories', 'customer', 'user'],
    });

    if (!pawn) {
      throw new Error('Không tìm thấy hợp đồng');
    }

    const { paymentHistories } = pawn;

    const transactionHistories = await transactionHistoryRepository.find({
      where: {
        pawnId: pawn.id,
        type: Equal(TransactionHistoryType.LOAN_MORE_MONEY),
      },
    });

    const transactionHistoriesMap: LoanMoreMoneyHistory[] =
      transactionHistories.map((transactionHistory) => ({
        customer: getFullName(
          pawn.customer?.firstName,
          pawn.customer?.lastName,
        ),
        paymentDate: formatDate(transactionHistory.created_at),
        loanMoney: transactionHistory.moneySub,
        ortherFee: transactionHistory.otherMoney,
        note: transactionHistory.note,
      }));

    const totalMoney = calculateTotalMoneyPaymentHistory(
      paymentHistories ?? [],
    );

    const paymentDownRootMoney: LoanMoreMoney = {
      paymentHistories: paymentHistories.map((paymentHistory) => ({
        ...paymentHistory,
        paymentDate: paymentHistory.endDate,
      })),
      transactionHistories: [...transactionHistoriesMap],
      contractInfo: {
        contractId: pawn.contractId,
        customer: getFullName(
          pawn.customer?.firstName,
          pawn.customer?.lastName,
        ),
        birthdayDate: formatDate(pawn.customer?.dateOfBirth),
        address: pawn.customer?.address,
        loanAmount: pawn.loanAmount,
        loanDate: formatDate(pawn.loanDate),
        interestRate: pawn.interestType,
        contractType: 'Cầm đồ',
        interestMoney: pawn.interestMoney,
      },
      customer: pawn.customer ?? {},
      totalMoney,
    };

    return paymentDownRootMoney;
  }

  async loanMoreMoneyConfirm(id: string, payload: LoanMoreMoneyDto) {
    const pawn = await this.pawnRepository.findOne({
      where: { id },
      relations: ['paymentHistories', 'customer', 'user'],
    });

    if (!pawn) {
      throw new Error('Không tìm thấy hợp đồng');
    }

    await this.databaseService.runTransaction(async (repositories) => {
      const {
        paymentPeriodType,
        interestMoney,
        interestType,
        paymentPeriod,
        id,
        paymentHistories: pawnPaymentHistories,
      } = pawn;

      const {
        paymentHistoryRepository,
        transactionHistoryRepository,
        cashRepository,
        pawnRepository,
      } = repositories;

      const paymentHistories = await paymentHistoryRepository.find({
        where: {
          pawnId: id,
          paymentStatus: Or(Equal(PaymentStatusHistory.UNFINISH), IsNull()),
        },
      });

      const rootMoney =
        payload.loanMoney +
          paymentHistories.find((paymentHistory) => paymentHistory.isRootMoney)
            ?.payNeed ?? 0;

      const sortPaymentHistories = paymentHistories
        .filter(
          (paymentHistory) =>
            !(
              [
                PaymentHistoryType.DEDUCTION_MONEY,
                PaymentHistoryType.DOWN_ROOT_MONEY,
                PaymentHistoryType.LOAN_MORE_MONEY,
                PaymentHistoryType.OTHER_MONEY_DOWN_ROOT,
                PaymentHistoryType.OTHER_MONEY_LOAN_MORE,
              ] as string[]
            ).includes(paymentHistory.type),
        )
        .sort((p1, p2) => p1.rowId - p2.rowId);

      await Promise.all(
        sortPaymentHistories.map(async (paymentHistory) => {
          const totalDayMonth =
            paymentPeriodType === PawnPaymentPeriodType.MOTH ||
            paymentPeriodType === PawnPaymentPeriodType.REGULAR_MOTH
              ? calculateTotalDayRangeDate(
                  new Date(paymentHistory.startDate),
                  new Date(paymentHistory.endDate),
                )
              : undefined;

          const interestMoneyEachPeriod = this.countInterestMoneyEachPeriod(
            rootMoney,
            interestMoney,
            paymentPeriod,
            interestType,
            paymentPeriodType,
            totalDayMonth,
          );

          if (paymentHistory.isRootMoney) {
            await paymentHistoryRepository.update(
              { id: paymentHistory.id },
              {
                payNeed: rootMoney,
              },
            );
          } else {
            await paymentHistoryRepository.update(
              { id: paymentHistory.id },
              {
                payNeed: interestMoneyEachPeriod,
              },
            );
          }
        }),
      );

      if (payload.otherMoney > 0) {
        await paymentHistoryRepository.createPaymentHistory({
          rowId: pawnPaymentHistories.length + 1,
          pawnId: id,
          payMoney: payload.otherMoney,
          payNeed: payload.otherMoney,
          startDate: convertPostgresDate(payload.loanDate),
          endDate: convertPostgresDate(payload.loanDate),
          type: PaymentHistoryType.OTHER_MONEY_LOAN_MORE,
          paymentStatus: null,
          contractType: ContractType.CAM_DO,
          paymentMethod: pawn.paymentPeriodType,
          contractId: pawn.contractId,
          userId: pawn.userId,
        });
      }

      await transactionHistoryRepository.createPayloadAndSave({
        contract: { pawn },
        type: TransactionHistoryType.LOAN_MORE_MONEY,
        money: payload.loanMoney,
        otherMoney: payload.otherMoney,
        createdAt: getDateLocal(
          new Date(convertPostgresDate(payload.loanDate)),
        ),
        note: payload.note,
      });

      await cashRepository.createCashContract(
        { pawn },
        CashFilterType.PAYMENT_CONTRACT,
        { amount: payload.loanMoney + payload.otherMoney },
      );

      await pawnRepository.update(
        { id: pawn.id },
        { loanAmount: pawn.loanAmount + payload.loanMoney },
      );
    });

    await this.updateRevenue(pawn.id);

    return true;
  }

  async extendedPeriodRequest(id: string) {
    const pawn = await this.pawnRepository.findOne({
      where: { id },
      relations: ['paymentHistories', 'extendedPeriodHistories'],
    });

    if (!pawn) {
      throw new Error('Không tìm thấy hợp đồng');
    }

    const { paymentHistories, extendedPeriodHistories } = pawn;

    const totalMoney = calculateTotalMoneyPaymentHistory(
      paymentHistories ?? [],
    );

    const extendedPeriod: PawnExtendPeriod = {
      paymentHistories: paymentHistories.map((paymentHistory) => ({
        ...paymentHistory,
        paymentDate: paymentHistory.endDate,
      })),
      histories: extendedPeriodHistories,
      contractId: pawn.contractId,
      totalMoney,
    };

    return extendedPeriod;
  }

  async extendedPeriodConfirm(id: string, payload: ExtendedPeriodConfirmDto) {
    const pawn = await this.pawnRepository.findOne({
      where: { id },
      relations: [
        'paymentHistories',
        'customer',
        'user',
        'extendedPeriodHistories',
      ],
    });

    if (!pawn) {
      throw new Error('Không tìm thấy hợp đồng');
    }

    await this.databaseService.runTransaction(async (repositories) => {
      const {
        extendedPeriodHistory,
        pawnRepository,
        paymentHistoryRepository,
      } = repositories;

      const { paymentHistories } = pawn;

      const paymentHistoryRootMoney = paymentHistories.find(
        (paymentHistory) =>
          paymentHistory.type === PaymentHistoryType.ROOT_MONEY,
      );

      const newNumOfPayment = payload.periodNumber + pawn.numOfPayment;

      const clonePawn = { ...pawn, numOfPayment: newNumOfPayment } as Pawn;

      const newPaymentHistories = await this.countPawnPaymentHistory(
        clonePawn,
        clonePawn.user.id,
      );

      const newPaymentHistoryRootMoney = newPaymentHistories.find(
        (paymentHistory) =>
          paymentHistory.type === PaymentHistoryType.ROOT_MONEY,
      );

      const sortNewPaymentHistories = newPaymentHistories.sort(
        (p1, p2) => p1.rowId - p2.rowId,
      );

      const countNumOfPayment = pawn.numOfPayment - 1;

      for (let i = 0; i < sortNewPaymentHistories.length; i++) {
        if (i < countNumOfPayment) {
          continue;
        }

        const newPaymentHistory = sortNewPaymentHistories[i];

        if (
          newPaymentHistory.type !== PaymentHistoryType.ROOT_MONEY &&
          newPaymentHistory.endDate !== newPaymentHistoryRootMoney.endDate
        ) {
          const newExtendedPaymentHistory =
            await paymentHistoryRepository.create(newPaymentHistory);
          await paymentHistoryRepository.save(newExtendedPaymentHistory);
        } else {
          if (newPaymentHistory.type === PaymentHistoryType.ROOT_MONEY) {
            await paymentHistoryRepository.update(
              {
                id: paymentHistoryRootMoney.id,
              },
              {
                startDate: newPaymentHistory.startDate,
                endDate: newPaymentHistory.endDate,
                rowId: newPaymentHistory.rowId,
              },
            );
          } else {
            const paymentHistoryInterestRootMoney = paymentHistories.find(
              (paymentHistory) =>
                paymentHistory.type === PaymentHistoryType.INTEREST_MONEY &&
                formatDate(paymentHistory.endDate) ==
                  formatDate(paymentHistoryRootMoney.endDate),
            );

            await paymentHistoryRepository.update(
              {
                id: paymentHistoryInterestRootMoney?.id,
              },
              {
                startDate: newPaymentHistory.startDate,
                endDate: newPaymentHistory.endDate,
                rowId: newPaymentHistory.rowId,
              },
            );
          }
        }
      }

      await pawnRepository.update(
        { id: pawn.id },
        { numOfPayment: newNumOfPayment },
      );

      const newExtendedPeriod = await extendedPeriodHistory.create({
        pawnId: pawn.id,
        periodNumber: payload.periodNumber,
        extendedDate: convertPostgresDate(payload.extendedDate),
        reason: payload.reason,
      });

      await extendedPeriodHistory.save(newExtendedPeriod);
    });

    await this.updateRevenue(pawn.id);

    return true;
  }

  calculateTotalPricePawn(listPawn: Pawn[]) {
    let totalLoanAmount = 0;
    let totalMoneyPaid = 0;
    let totalMoneyToToday = 0;

    for (let i = 0; i < listPawn.length; i++) {
      const pawn = listPawn[i];
      const { paymentHistories } = pawn;

      totalLoanAmount += pawn.loanAmount;

      const moneyPaidNumber = paymentHistories.reduce(
        (total, paymentHistory) => {
          if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
            return (total += paymentHistory.payMoney);
          }
          return total;
        },
        0,
      );

      totalMoneyPaid += moneyPaidNumber;

      const { interestMoneyToday } = calculateInterestToTodayPawn(pawn);

      totalMoneyToToday += interestMoneyToday;
    }

    return { totalLoanAmount, totalMoneyPaid, totalMoneyToToday };
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleUpdatePawnDebitStatus() {
    this.logger.log(
      {
        customerMessage: `Update debit status in Pawn ( Cầm đồ ) date ${formatDate(new Date())}`,
      },
      null,
    );

    const pawns = await this.list({
      where: { debitStatus: Not(DebitStatus.COMPLETED) },
    });

    Promise.allSettled(
      pawns.map(async (pawn) => {
        await this.contractService.updatePawnStatus(pawn.id);
      }),
    );
  }
}
