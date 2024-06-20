import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ContractType, DebitStatus } from 'src/common/types';
import { ServiceFee } from 'src/bat-ho/bat-ho.type';
import { TransactionHistoryType } from 'src/transaction-history/transaction-history.type';
import {
  LoanMoreMoney,
  LoanMoreMoneyHistory,
  PawnExtendPeriod,
  PawnPaymentPeriodType,
  PaymentDownRootMoney,
  PaymentDownRootMoneyHistory,
  SettlementPawn,
} from 'src/pawn/pawn.type';
import { BaseService } from 'src/common/service/base.service';
import { getFullName } from 'src/common/utils/get-full-name';
import { calculateTotalMoneyPaymentHistory } from 'src/common/utils/history';
import {
  calculateTotalDayRangeDate,
  convertPostgresDate,
  formatDate,
  getDateLocal,
  getTodayNotTimeZone,
} from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import { LoggerServerService } from 'src/logger/logger-server.service';
import { User } from 'src/user/user.entity';
import {
  And,
  Between,
  DataSource,
  EntityManager,
  Equal,
  FindManyOptions,
  FindOneOptions,
  ILike,
  IsNull,
  Not,
  Or,
} from 'typeorm';
import { CreatePawnDto } from './dto/create-pawn.dto';
import { ExtendedPeriodConfirmDto } from './dto/extended-period-confirm.dto';
import { ListPawnQueryDto } from './dto/list-pawn-query.dto';
import { LoanMoreMoneyDto } from './dto/loan-more-money.dto';
import { PaymentDownRootMoneyDto } from './dto/payment-down-root-money.dto';
import { SettlementPawnDto } from './dto/settlement-pawn.dto';
import { UpdatePawnDto } from './dto/update-pawn.dto';
import { Pawn } from './pawn.entity';
import { PawnRepository } from './pawn.repository';
import { ContractService } from 'src/contract/contract.service';
import {
  PaymentHistoryType,
  PaymentStatusHistory,
} from 'src/payment-history/payment-history.type';
import { InitWarehouseData } from 'src/warehouse/warehouse.data';
import { CashFilterType } from 'src/cash/cash.type';

@Injectable()
export class PawnService extends BaseService<
  Pawn,
  CreatePawnDto,
  UpdatePawnDto
> {
  protected manager: EntityManager;

  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
    private logger: LoggerServerService,
    @InjectRepository(Pawn)
    private readonly pawnRepository: PawnRepository,
    private contractService: ContractService,
  ) {
    super();
    this.manager = this.dataSource.manager;
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
          assetRepository,
          warehouseRepository,
        } = repositories;

        let payloadData = {
          ...payload,
          customer: undefined,
          loanDate: convertPostgresDate(payload.loanDate),
          debitStatus: payload.debitStatus ?? DebitStatus.IN_DEBIT,
          warehouseId: undefined,
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

          payloadData = {
            ...payloadData,
            customerId: newCustomer.id,
          };
        }

        const newPawn = await pawnRepository.createPawn({
          ...payloadData,
          userId,
        });

        const paymentHistoriesPayload =
          await pawnRepository.createPaymentHistoriesPayload(newPawn);

        const newPaymentHistories =
          await paymentHistoryRepository.createManyPaymentHistory(
            paymentHistoriesPayload,
          );

        const lastPaymentHistory =
          newPaymentHistories[newPaymentHistories.length - 1];

        await pawnRepository.update(
          { id: newPawn.id },
          {
            finishDate: lastPaymentHistory.endDate,
          },
        );

        await pawnRepository.updateRevenueReceived(newPawn.id);

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

        if (payload.warehouseId) {
          await assetRepository.createAssetFromPawn({
            pawn: newPawn,
            warehouseId: payload.warehouseId,
          });
        } else {
          const warehouse = await warehouseRepository.findOne({
            where: { name: InitWarehouseData[0].name },
          });

          if (warehouse) {
            await assetRepository.createAssetFromPawn({
              pawn: newPawn,
              warehouseId: warehouse.id,
            });
          }
        }

        return newPawn;
      },
    );

    await this.pawnRepository.updateStatus(newPawn.id);

    await this.contractService.updateBadDebitStatusCustomer(newPawn.customerId);

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

        const pawn = await pawnRepository.checkPawnExist(
          {
            where: [{ id }, { contractId: id }],
          },
          { message: 'Hợp đồng không tồn tại' },
        );

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

        const pawnLoanDate = formatDate(pawn.loanDate);

        const isUpdateLoanAmount =
          payload.loanAmount && payload.loanAmount !== pawn.loanAmount;

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
          isUpdateLoanAmount ||
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

          await cashRepository.update(
            {
              pawnId: pawn.id,
              filterType: CashFilterType.PAYMENT_CONTRACT,
            },
            { amount: payload.loanAmount },
          );

          await paymentHistoryRepository.delete({ pawnId: pawn.id });

          await transactionHistoryRepository.delete({ pawnId: pawn.id });

          const paymentHistoriesPayload =
            await pawnRepository.createPaymentHistoriesPayload(pawn);

          const newPaymentHistories =
            await paymentHistoryRepository.createManyPaymentHistory(
              paymentHistoriesPayload,
            );

          const revenueReceived = newPaymentHistories.reduce(
            (total, paymentHistory) => {
              return total + paymentHistory.payNeed;
            },
            0,
          );

          await pawnRepository.update(
            { id: pawn.id },
            { revenueReceived, rootMoney: payload.loanAmount },
          );

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

        await pawnRepository.updateRevenueReceived(pawn.id);

        return pawn;
      },
    );

    await this.pawnRepository.updateStatus(pawnUpdated.id);

    await this.contractService.updateBadDebitStatusCustomer(
      pawnUpdated.customerId,
    );

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

  async listPawn(queryData: ListPawnQueryDto, me: User) {
    const { userRepository, pawnRepository } =
      this.databaseService.getRepositories();

    const {
      search,
      fromDate,
      toDate,
      page,
      pageSize,
      debitStatus,
      receiptToday,
    } = queryData;

    const user = userRepository.filterRole(me);

    const where = [];
    const from = fromDate ? fromDate : formatDate(new Date());
    const to = toDate ? toDate : formatDate(new Date());
    const today = formatDate(new Date());
    let paymentHistories = undefined;

    if (receiptToday === true) {
      paymentHistories = {
        endDate: Equal(convertPostgresDate(today)),
        paymentStatus: Or(Equal(false), IsNull()),
        type: Not(PaymentHistoryType.DEDUCTION_MONEY),
      };
    }

    const query = {
      loanDate: receiptToday
        ? undefined
        : Between(convertPostgresDate(from), convertPostgresDate(to)),
      deleted_at: IsNull(),
      debitStatus: receiptToday
        ? And(Not(DebitStatus.COMPLETED), Not(DebitStatus.DELETED))
        : Not(DebitStatus.DELETED),
      user,
      paymentHistories,
    };

    if (
      (!search || (search as string).trim().length === 0) &&
      (!debitStatus || (debitStatus as string).trim().length === 0)
    ) {
      where.push({
        ...query,
      });
    } else {
      if (debitStatus && !receiptToday) {
        const values = Object.values(DebitStatus).map((value) =>
          value.toString(),
        );
        if (values.includes(debitStatus)) {
          where.push({
            ...query,
            debitStatus: ILike(debitStatus),
          });
        }
      }

      if (search) {
        const searchType = parseInt((search as string) ?? '');

        if (!Number.isNaN(searchType)) {
          where.push({
            ...query,
            customer: {
              phoneNumber: ILike(search),
            },
          });
          where.push({
            ...query,
            customer: {
              personalID: ILike(search),
            },
          });
        } else {
          where.push({
            ...query,
            customer: {
              firstName: ILike(search),
            },
          });
          where.push({
            ...query,
            customer: {
              lastName: ILike(search),
            },
          });
          where.push({
            ...query,
            contractId: ILike(search),
          });
        }
      }
    }

    const options: FindManyOptions<Pawn> = {
      relations: pawnRepository.getRelations([]),
      where: [...where],
      take: pageSize,
      skip: page ? ((page ?? 1) - 1) * (pageSize ?? 10) : undefined,
      order: { created_at: 'ASC' },
    };

    return pawnRepository.listPawn(options);
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

  async settlementRequest(id: string) {
    const pawn = await this.pawnRepository.checkPawnExist(
      {
        where: { id },
        relations: ['paymentHistories', 'customer'],
      },
      { message: 'Không tìm thấy hợp đồng' },
    );

    const today = getTodayNotTimeZone();

    const { loanAmount, loanDate, paymentHistories } = pawn;

    const { settlementMoney, interestMoneyTotal, moneyPaid, totalDayToToday } =
      this.pawnRepository.getSettlementInfo(pawn, today);

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
    const pawn = await this.pawnRepository.checkPawnExist(
      {
        where: { id },
        relations: ['paymentHistories', 'customer'],
      },
      { message: 'Không tìm thấy hợp đồng' },
    );

    const { loanAmount, loanDate, paymentHistories } = pawn;

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

    const { settlementMoney, interestMoneyTotal, moneyPaid, totalDayToToday } =
      this.pawnRepository.getSettlementInfo(
        pawn,
        new Date(getDateLocal(new Date(convertPostgresDate(paymentDate)))),
      );

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
    const pawn = await this.pawnRepository.checkPawnExist(
      {
        where: { id },
        relations: ['paymentHistories', 'customer'],
      },
      { message: 'Không tìm thấy hợp đồng' },
    );

    const { paymentHistories } = pawn;

    const rootPaymentHistory = paymentHistories.find(
      (paymentHistory) => paymentHistory.type === PaymentHistoryType.ROOT_MONEY,
    );

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

    const { settlementMoney: settlementMoneyExpected } =
      this.pawnRepository.getSettlementInfo(
        pawn,
        new Date(getDateLocal(new Date(convertPostgresDate(paymentDate)))),
      );

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

      await paymentHistoryRepository.sortRowId({ pawnId: pawn.id });
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
        (paymentHistories.find(
          (paymentHistory) =>
            paymentHistory.type === PaymentHistoryType.ROOT_MONEY,
        )?.payNeed ?? 0) - payload.paymentMoney;

      const sortPaymentHistories = paymentHistories
        .filter(
          (paymentHistory) =>
            !(
              [
                PaymentHistoryType.DEDUCTION_MONEY,
                PaymentHistoryType.DOWN_ROOT_MONEY,
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

          const interestMoneyEachPeriod =
            this.pawnRepository.calculateInterestMoneyEachPeriod({
              loanAmount: rootMoney,
              interestMoney,
              paymentPeriod,
              interestType,
              paymentPeriodType,
              totalDayMonth,
            });

          if (paymentHistory.type === PaymentHistoryType.ROOT_MONEY) {
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

      await paymentHistoryRepository.createPaymentHistory({
        rowId: pawnPaymentHistories.length + 1,
        pawnId: id,
        payMoney: payload.paymentMoney,
        payNeed: payload.paymentMoney,
        startDate: convertPostgresDate(payload.paymentDate),
        endDate: convertPostgresDate(payload.paymentDate),
        type: PaymentHistoryType.DOWN_ROOT_MONEY,
        paymentStatus: PaymentStatusHistory.FINISH,
        contractType: ContractType.CAM_DO,
        paymentMethod: pawn.paymentPeriodType,
        contractId: pawn.contractId,
        userId: pawn.userId,
      });

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
        CashFilterType.DOWN_ROOT_MONEY,
        { amount: payload.paymentMoney + payload.otherMoney },
      );

      await pawnRepository.update(
        { id: pawn.id },
        { loanAmount: pawn.loanAmount - payload.paymentMoney },
      );

      await pawnRepository.updateRevenueReceived(pawn.id);

      await paymentHistoryRepository.sortRowId({ pawnId: pawn.id });
    });

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
          paymentHistories.find(
            (paymentHistory) =>
              paymentHistory.type === PaymentHistoryType.ROOT_MONEY,
          )?.payNeed ?? 0;

      const sortPaymentHistories = paymentHistories
        .filter(
          (paymentHistory) =>
            !(
              [
                PaymentHistoryType.DEDUCTION_MONEY,
                PaymentHistoryType.DOWN_ROOT_MONEY,
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

          const interestMoneyEachPeriod =
            this.pawnRepository.calculateInterestMoneyEachPeriod({
              loanAmount: rootMoney,
              interestMoney,
              paymentPeriod,
              interestType,
              paymentPeriodType,
              totalDayMonth,
            });

          if (paymentHistory.type === PaymentHistoryType.ROOT_MONEY) {
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
          payMoney: 0,
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
        CashFilterType.LOAN_MORE_CONTRACT,
        { amount: payload.loanMoney + payload.otherMoney },
      );

      await pawnRepository.update(
        { id: pawn.id },
        { loanAmount: pawn.loanAmount + payload.loanMoney },
      );

      await pawnRepository.updateRevenueReceived(pawn.id);

      await paymentHistoryRepository.sortRowId({ pawnId: pawn.id });
    });

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

      const newPaymentHistoriesPayload =
        await this.pawnRepository.createPaymentHistoriesPayload(clonePawn);

      const newPaymentHistoryRootMoney = newPaymentHistoriesPayload.find(
        (paymentHistory) =>
          paymentHistory.type === PaymentHistoryType.ROOT_MONEY,
      );

      const sortNewPaymentHistories = newPaymentHistoriesPayload.sort(
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

      await pawnRepository.updateRevenueReceived(pawn.id);

      await paymentHistoryRepository.sortRowId({ pawnId: pawn.id });
    });

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

      const { interestMoneyToday } =
        this.pawnRepository.calculateInterestToToday(pawn);

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
        await this.pawnRepository.updateStatus(pawn.id);
        await this.contractService.updateBadDebitStatusCustomer(
          pawn.customerId,
        );
      }),
    );
  }
}
