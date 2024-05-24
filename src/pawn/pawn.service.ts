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
  PawnInterestType,
  PawnPaymentPeriodType,
  PaymentDownRootMoney,
  PaymentDownRootMoneyHistory,
  SettlementPawn,
} from 'src/common/interface/pawn';
import { BaseService } from 'src/common/service/base.service';
import {
  createCashContractPayload,
  createPaymentHistoriesCash,
} from 'src/common/utils/cash-payload';
import { getFullName } from 'src/common/utils/get-full-name';
import { getContentTransactionHistory } from 'src/common/utils/history';
import {
  calculateTotalDayRangeDate,
  convertPostgresDate,
  countFromToDate,
  formatDate,
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
import { SettlementPawnDto } from './dto/settlement-pawn.dto';
import { UpdatePawnDto } from './dto/update-pawn.dto';
import { Pawn } from './pawn.entity';
import { PaymentDownRootMoneyDto } from './dto/payment-down-root-money.dto';

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
    const { customerId, customer, userId } = payload;

    const newPawn = await this.databaseService.runTransaction(
      async (repositories) => {
        const {
          pawnRepository,
          customerRepository,
          paymentHistoryRepository,
          transactionHistoryRepository,
          userRepository,
          cashRepository,
        } = repositories;

        let payloadData = {
          ...payload,
          customer: undefined,
          loanDate: convertPostgresDate(payload.loanDate),
          debitStatus: payload.debitStatus ?? DebitStatus.IN_DEBIT,
        };

        if (customerId) {
          const findCustomer = await customerRepository.findOne({
            where: { id: customerId },
          });

          if (!findCustomer) {
            throw new Error('Không tìm thấy khách hàng.');
          }

          payloadData = { ...payloadData, customerId };
          payload.customer = findCustomer;
        } else {
          const customerPersonalID = await customerRepository.findOne({
            where: { personalID: customer?.personalID },
          });

          if (customerPersonalID) {
            throw new BadRequestException('Số CMND/CCCD đã tồn tại.');
          }

          const customerPhonenumber = await customerRepository.findOne({
            where: { phoneNumber: customer?.phoneNumber },
          });

          if (customerPhonenumber) {
            throw new BadRequestException('Số điện thoại đã tồn tại.');
          }
          let newCustomer = await customerRepository.create({
            ...customer,
            dateOfBirth: convertPostgresDate(customer.dateOfBirth),
          });
          newCustomer = await customerRepository.save(newCustomer);
          payloadData = { ...payloadData, customerId: newCustomer.id };
        }

        const pawnContract = await pawnRepository.findOne({
          where: { contractId: payload.contractId },
        });

        if (pawnContract) {
          throw new BadRequestException('Mã hợp đồng đã tồn tại.');
        }

        const pawnNotCompleted = await pawnRepository.findOne({
          where: {
            customerId: payloadData.customerId,
            debitStatus: Not(DebitStatus.COMPLETED),
          },
        });

        if (pawnNotCompleted) {
          throw new BadRequestException(
            'Khách hàng còn hợp đồng chưa trả hết.',
          );
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

        await pawnRepository.update(
          { id: newPawn.id },
          {
            revenueReceived,
          },
        );

        const user = await userRepository.findOne({ where: { id: userId } });

        const newCashPaymentContract = await cashRepository.create(
          createCashContractPayload(
            user,
            payload.customer as any,
            CashFilterType.PAYMENT_CONTRACT,
            {
              id: newPawn.id,
              amount: payload.loanAmount,
              date: formatDate(newPawn.loanDate),
              contractType: ContractType.CAM_DO,
              contractId: newPawn.contractId,
            },
          ),
        );

        await cashRepository.save(newCashPaymentContract);

        const newCashReceipt = await cashRepository.create({
          ...createCashContractPayload(
            user,
            payload.customer as any,
            CashFilterType.RECEIPT_CONTRACT,
            {
              id: newPawn.id,
              amount: 0,
              date: formatDate(newPawn.loanDate),
              contractType: ContractType.CAM_DO,
              contractId: newPawn.contractId,
            },
          ),
          paymentHistories: createPaymentHistoriesCash(newPaymentHistories),
          contractId: newPawn.contractId,
          contractStatus: newPawn.debitStatus,
        });

        await cashRepository.save(newCashReceipt);

        const newTransactionHistory = await transactionHistoryRepository.create(
          {
            userId,
            pawnId: newPawn.id,
            contractId: newPawn.contractId,
            type: TransactionHistoryType.CREATE_CONTRACT,
            content: getContentTransactionHistory(
              TransactionHistoryType.CREATE_CONTRACT,
            ),
            moneySub: newPawn.loanAmount,
            moneyAdd: 0,
            otherMoney: 0,
          },
        );

        await transactionHistoryRepository.save(newTransactionHistory);

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
              paymentHistories: createPaymentHistoriesCash(newPaymentHistories),
              contractId: payload.contractId,
              contractStatus: pawn.debitStatus,
            },
          );

          const newTransactionHistory =
            await transactionHistoryRepository.create({
              userId: pawn.userId,
              pawnId: pawn.id,
              contractId: pawn.contractId,
              type: TransactionHistoryType.CREATE_CONTRACT,
              content: getContentTransactionHistory(
                TransactionHistoryType.CREATE_CONTRACT,
              ),
              moneySub: pawn.loanAmount,
              moneyAdd: 0,
              otherMoney: 0,
            });

          await transactionHistoryRepository.save(newTransactionHistory);
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

    let duration = numOfPayment + 1;
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
      new Date(loanDate),
      today,
    );

    const interestMoneyTotal = totalDayToToday * interestMoneyOneDay;

    const moneyPaid = paymentHistories.reduce((total, paymentHistory) => {
      if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
        return total + paymentHistory.payMoney;
      }
      return total;
    }, 0);

    const settlementMoney = loanAmount + interestMoneyTotal - moneyPaid;

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
        new Date(paymentHistory.endDate).setHours(0, 0, 0) < paymentDateTime
      ) {
        return total + paymentHistory.payMoney;
      }
      return total;
    }, 0);

    const settlementMoney = loanAmount + interestMoneyTotal - moneyPaid;

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
      new Date(paymentDate),
      today,
    );

    const interestMoneyTotal = totalDayToToday * interestMoneyOneDay;

    const moneyPaid = paymentHistories.reduce((total, paymentHistory) => {
      if (
        paymentHistory.paymentStatus === PaymentStatusHistory.FINISH &&
        new Date(paymentHistory.endDate).setHours(0, 0, 0) < paymentDateTime
      ) {
        return total + paymentHistory.payMoney;
      }
      return total;
    }, 0);

    const settlementMoneyExpected = loanAmount + interestMoneyTotal - moneyPaid;

    if (settlementMoney < settlementMoneyExpected) {
      throw new Error(`Số tiền đóng không được nhỏ hơn số tiền còn phải thu`);
    }

    let feeServiceTotal = 0;

    if (serviceFee) {
      feeServiceTotal = serviceFee.reduce((total, fee) => total + fee.value, 0);
    }

    await this.databaseService.runTransaction(async (repositories) => {
      const { cashRepository, transactionHistoryRepository, pawnRepository } =
        repositories;

      const cash = await cashRepository.findOne({
        where: {
          contractId: pawn.contractId,
          filterType: CashFilterType.RECEIPT_CONTRACT,
        },
      });

      cash.amount = settlementMoney + feeServiceTotal;

      await cashRepository.save(cash);

      const newTransactionHistory = await transactionHistoryRepository.create({
        pawnId: pawn.id,
        userId: pawn.user?.id,
        contractId: pawn.contractId,
        type: TransactionHistoryType.PAYMENT,
        content: `Tất toán hợp đồng ${pawn.contractId}`,
        moneyAdd: settlementMoney + feeServiceTotal,
        moneySub: 0,
        otherMoney: 0,
      });

      await transactionHistoryRepository.save(newTransactionHistory);

      await pawnRepository.update(
        { id: pawn.id },
        {
          debitStatus: DebitStatus.COMPLETED,
          settlementDate: convertPostgresDate(paymentDate),
          serviceFee,
        },
      );
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

    const paymentDownRootMoney: PaymentDownRootMoney = {
      paymentHistories,
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
      } = repositories;

      const paymentHistories = await paymentHistoryRepository.find({
        where: {
          pawnId: id,
          paymentStatus: Or(Equal(PaymentStatusHistory.UNFINISH), IsNull()),
          type: Or(
            Not(Equal(PaymentHistoryType.DOWN_ROOT_MONEY)),
            Not(Equal(PaymentHistoryType.ADD_ROOT_MONEY)),
            Not(Equal(PaymentHistoryType.OTHER_MONEY)),
          ),
        },
      });

      const rootMoney = pawn.loanAmount - payload.paymentMoney;

      const sortPaymentHistories = paymentHistories.sort(
        (p1, p2) => p1.rowId - p2.rowId,
      );

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
                payMoney: rootMoney,
              },
            );
          } else {
            await paymentHistoryRepository.update(
              { id: paymentHistory.id },
              {
                payMoney: interestMoneyEachPeriod,
              },
            );
          }
        }),
      );

      const downPaymentHistory = await paymentHistoryRepository.create({
        rowId: pawnPaymentHistories.length + 1,
        pawnId: id,
        payMoney: payload.paymentMoney,
        payNeed: payload.paymentMoney,
        startDate: convertPostgresDate(payload.paymentDate),
        endDate: convertPostgresDate(payload.paymentDate),
        type: PaymentHistoryType.DOWN_ROOT_MONEY,
        paymentStatus: PaymentStatusHistory.FINISH,
        contractType: ContractType.CAM_DO,
      });
      await paymentHistoryRepository.save(downPaymentHistory);

      const ortherPaymentHistory = await paymentHistoryRepository.create({
        rowId: pawnPaymentHistories.length + 2,
        pawnId: id,
        payMoney: payload.otherMoney,
        payNeed: payload.otherMoney,
        startDate: convertPostgresDate(payload.paymentDate),
        endDate: convertPostgresDate(payload.paymentDate),
        type: PaymentHistoryType.OTHER_MONEY,
        paymentStatus: PaymentStatusHistory.FINISH,
        contractType: ContractType.CAM_DO,
      });
      await paymentHistoryRepository.save(ortherPaymentHistory);

      const newTransactionHistory = await transactionHistoryRepository.create({
        pawnId: pawn.id,
        userId: pawn.user?.id,
        contractId: pawn.contractId,
        type: TransactionHistoryType.PAYMENT_DOWN_ROOT_MONEY,
        content: `Trả bớt gốc hợp đồng ${pawn.contractId}`,
        moneyAdd: payload.paymentMoney,
        moneySub: 0,
        otherMoney: payload.otherMoney,
        note: payload.note,
      });

      await transactionHistoryRepository.save(newTransactionHistory);

      const cash = await cashRepository.findOne({
        where: {
          contractId: pawn.contractId,
          filterType: CashFilterType.RECEIPT_CONTRACT,
        },
      });

      cash.amount = payload.otherMoney + payload.paymentMoney;

      await cashRepository.save(cash);
    });

    return true;
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
