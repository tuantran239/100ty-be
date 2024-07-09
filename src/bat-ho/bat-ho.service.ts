import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DebitStatus } from 'src/common/types';
import { TransactionHistoryType } from 'src/transaction-history/transaction-history.type';
import { BaseService } from 'src/common/service/base.service';
import { convertPostgresDate, formatDate } from 'src/common/utils/time';
import { ContractService } from 'src/contract/contract.service';
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
import { BatHo } from './bat-ho.entity';
import { BatHoRepository } from './bat-ho.repository';
import { BatHoResponseDto } from './dto/bat-ho-response.dto';
import { CreateBatHoDto } from './dto/create-bat-ho.dto';
import { ListBatHoQueryDto } from './dto/list-bat-ho-query.dto';
import { SettlementBatHoDto } from './dto/settlement-bat-ho.dto';
import { UpdateBatHoDto } from './dto/update-bat-ho.dto';
import {
  PaymentHistoryType,
  PaymentStatusHistory,
} from 'src/payment-history/payment-history.type';
import { CashFilterType } from 'src/cash/cash.type';
import { UserResponseDto } from 'src/user/dto/user-response.dto';

@Injectable()
export class BatHoService extends BaseService<
  BatHo,
  CreateBatHoDto,
  UpdateBatHoDto
> {
  protected manager: EntityManager;
  constructor(
    private dataSource: DataSource,
    private logger: LoggerServerService,
    private databaseService: DatabaseService,
    private contractService: ContractService,
    @InjectRepository(BatHo) private readonly batHoRepository: BatHoRepository,
  ) {
    super();
    this.manager = this.dataSource.manager;
  }

  async create(payload: CreateBatHoDto) {
    const { customerId } = payload;

    const newBatHo = await this.databaseService.runTransaction(
      async (repositories) => {
        const {
          batHoRepository,
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
          const findCustomer = await customerRepository.findAndCheckValid({
            data: { id: customerId },
            type: 'not_found',
            field: 'id',
          });

          payload.customer = { ...findCustomer, storeId: payload.storeId };
        } else {
          const newCustomer = await customerRepository.createAndSave({
            ...payload.customer,
            userId: payload.userId,
          });

          payloadData = {
            ...payloadData,
            customerId: newCustomer.id,
          };
        }

        const newBatHo = await batHoRepository.createBatHo({
          ...payloadData,
        });

        const paymentHistoriesPayload =
          await batHoRepository.createPaymentHistoriesPayload(newBatHo);

        const newPaymentHistories =
          await paymentHistoryRepository.createManyPaymentHistory(
            paymentHistoriesPayload,
          );

        const deductionMoney = newPaymentHistories.reduce(
          (total, paymentHistory) => {
            if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
              return total + paymentHistory.payMoney;
            }
            return total;
          },
          0,
        );

        const batHo = await batHoRepository.findOne({
          where: { id: newBatHo.id },
          relations: ['customer', 'user'],
        });

        await cashRepository.createCashContract(
          { icloud: batHo },
          CashFilterType.DEDUCTION,
          { amount: deductionMoney },
        );

        await cashRepository.createCashContract(
          { icloud: batHo },
          CashFilterType.PAYMENT_CONTRACT,
          { amount: payload.fundedAmount },
        );

        await cashRepository.createCashContract(
          { icloud: batHo },
          CashFilterType.RECEIPT_CONTRACT,
          { amount: 0 },
        );

        await transactionHistoryRepository.createPayloadAndSave({
          contract: { icloud: newBatHo },
          type: TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT,
          money: newBatHo.fundedAmount,
          otherMoney: 0,
          createdAt: newBatHo.loanDate,
        });

        await Promise.all(
          newPaymentHistories
            .filter(
              (paymentHistory) =>
                paymentHistory.type === PaymentHistoryType.DEDUCTION_MONEY,
            )
            .map(async (paymentHistory) => {
              await transactionHistoryRepository.createPayloadAndSave({
                contract: { icloud: newBatHo },
                type: TransactionHistoryType.DEDUCTION_MONEY,
                money: paymentHistory.payMoney,
                otherMoney: 0,
                createdAt: newBatHo.loanDate,
                paymentHistoryId: paymentHistory.id,
              });
            }),
        );

        return newBatHo;
      },
    );

    await this.batHoRepository.updateStatus(newBatHo.id);

    await this.contractService.updateBadDebitStatusCustomer(
      newBatHo.customerId,
    );

    return newBatHo;
  }

  async update(id: string, payload: UpdateBatHoDto): Promise<any> {
    const batHoUpdated = await this.databaseService.runTransaction(
      async (repositories) => {
        const {
          batHoRepository,
          cashRepository,
          paymentHistoryRepository,
          transactionHistoryRepository,
        } = repositories;

        const batHo = await this.batHoRepository.checkBatHoExist(
          { where: [{ id }, { contractId: id }] },
          { message: 'Hợp đồng không tồn tại' },
        );

        if (payload.contractId && batHo.contractId !== payload.contractId) {
          await this.batHoRepository.checkBatHoExist(
            { where: { contractId: payload.contractId } },
            { message: 'Mã hợp đồng đã tồn tại.' },
            true,
          );
        }

        if (payload.debitStatus && payload.debitStatus !== batHo.debitStatus) {
          const values = Object.values(DebitStatus);
          const isDebitStatus = values.find(
            (val) => val == payload.debitStatus,
          );
          if (!isDebitStatus) {
            throw new Error('Trạng thái không hợp lệ.');
          }
        }

        if (payload.loanAmount > payload.revenueReceived) {
          throw new Error('Số tiền nhận về không thể nhỏ hơn khoản vay');
        }

        if (
          payload.fundedAmount &&
          payload.fundedAmount !== batHo.fundedAmount
        ) {
          await cashRepository.update(
            {
              batHoId: batHo.id,
              filterType: CashFilterType.PAYMENT_CONTRACT,
            },
            { amount: payload.fundedAmount },
          );
        }

        const batHoLoanDate = formatDate(batHo.loanDate);

        const isUpdateLoanDate =
          payload.loanDate && batHoLoanDate !== payload.loanDate;

        const isUpdateDeductionDay =
          payload.deductionDays &&
          batHo.deductionDays !== payload.deductionDays;

        const isUpdateLoanDurationDay =
          payload.loanDurationDays &&
          batHo.loanDurationDays !== payload.loanDurationDays;

        const isRevenueReceived =
          payload.revenueReceived &&
          payload.revenueReceived !== batHo.revenueReceived;

        if (
          isUpdateLoanDate ||
          isUpdateDeductionDay ||
          isUpdateLoanDurationDay ||
          isRevenueReceived
        ) {
          batHo.loanDate = convertPostgresDate(payload.loanDate);
          batHo.deductionDays = payload.deductionDays;
          batHo.loanDurationDays = payload.loanDurationDays;
          batHo.revenueReceived = payload.revenueReceived;

          await paymentHistoryRepository.delete({ batHoId: batHo.id });

          await transactionHistoryRepository.delete({ batHoId: batHo.id });

          const paymentHistories =
            await batHoRepository.createPaymentHistoriesPayload(batHo);

          const newPaymentHistories =
            await paymentHistoryRepository.createManyPaymentHistory(
              paymentHistories,
            );

          const deductionMoney = paymentHistories.reduce(
            (total, paymentHistory) => {
              if (
                paymentHistory.paymentStatus === PaymentStatusHistory.FINISH
              ) {
                return total + paymentHistory.payMoney;
              }
              return total;
            },
            0,
          );

          await cashRepository.update(
            { batHoId: batHo.id, filterType: CashFilterType.DEDUCTION },
            { amount: deductionMoney },
          );

          await cashRepository.update(
            { batHoId: batHo.id, filterType: CashFilterType.RECEIPT_CONTRACT },
            {
              amount: 0,
              contractId: payload.contractId,
              contractStatus: batHo.debitStatus,
            },
          );

          await transactionHistoryRepository.createPayloadAndSave({
            contract: { icloud: batHo },
            type: TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT,
            money: batHo.fundedAmount,
            otherMoney: 0,
            createdAt: batHo.loanDate,
          });

          await Promise.all(
            newPaymentHistories
              .filter(
                (paymentHistory) =>
                  paymentHistory.type === PaymentHistoryType.DEDUCTION_MONEY,
              )
              .map(async (paymentHistory) => {
                await transactionHistoryRepository.createPayloadAndSave({
                  contract: { icloud: batHo },
                  type: TransactionHistoryType.DEDUCTION_MONEY,
                  money: paymentHistory.payMoney,
                  otherMoney: 0,
                  createdAt: batHo.loanDate,
                  paymentHistoryId: paymentHistory.id,
                });
              }),
          );
        }

        await this.batHoRepository.save({
          ...batHo,
          ...payload,
          loanDate: convertPostgresDate(payload.loanDate),
        });

        return batHo;
      },
    );

    await this.batHoRepository.updateStatus(batHoUpdated.id);

    await this.contractService.updateBadDebitStatusCustomer(
      batHoUpdated.customerId,
    );

    return batHoUpdated;
  }

  async delete(id: string): Promise<any> {
    const batHo = await this.batHoRepository.findOne({
      where: [{ id }, { contractId: id }],
    });

    if (!batHo) {
      throw new Error('Không tìm thấy hợp đồng');
    }

    return await this.batHoRepository.save({
      ...batHo,
      deleted_at: new Date(),
    });
  }

  async remove(id: string): Promise<any> {
    const batHo = await this.batHoRepository.findOne({
      where: [{ id }, { contractId: id }],
    });

    if (!batHo) {
      throw new Error('Không tìm thấy hợp đồng');
    }

    return await this.batHoRepository.delete({
      id: batHo.id,
    });
  }

  async listBatHo(queryData: ListBatHoQueryDto, me: UserResponseDto) {
    const { userRepository, batHoRepository } =
      this.databaseService.getRepositories();

    const queryDefault = userRepository.filterQuery(
      {
        userId: me.id,
        me,
        workspaceId: queryData.workspaceId,
        storeId: queryData.storeId,
      },
      { createdBy: true },
    );

    const {
      search,
      fromDate,
      toDate,
      page,
      pageSize,
      debitStatus,
      device,
      hostServer,
      receiptToday,
    } = queryData;

    let paymentHistories = undefined;

    const where = [];
    const from = fromDate ? fromDate : formatDate(new Date());
    const to = toDate ? toDate : formatDate(new Date());
    const today = formatDate(new Date());

    if (receiptToday === true) {
      paymentHistories = {
        startDate: Equal(convertPostgresDate(today)),
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
      paymentHistories,
      ...queryDefault,
    };

    if (
      (!search || (search as string).trim().length === 0) &&
      (!debitStatus || (debitStatus as string).trim().length === 0) &&
      (!device || (device as string).trim().length === 0) &&
      (!hostServer || (hostServer as string).trim().length === 0)
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

      if (device) {
        where.push({
          ...query,
          device: {
            name: ILike(device),
          },
        });
      }

      if (hostServer) {
        where.push({
          ...query,
          hostServer: {
            name: ILike(hostServer),
          },
        });
      }
    }

    const options: FindManyOptions<BatHo> = {
      relations: batHoRepository.getRelations([]),
      where: [...where],
      take: pageSize,
      skip: page ? ((page ?? 1) - 1) * (pageSize ?? 10) : undefined,
      order: { created_at: 'ASC' },
    };

    return batHoRepository.listBatHo(options);
  }

  async getBatHoInfo(options: FindOneOptions<BatHo>) {
    return await this.batHoRepository.getBatHo(options);
  }

  async list(options: FindManyOptions<BatHo>): Promise<BatHo[]> {
    return this.batHoRepository.find(options);
  }

  async listAndCount(
    options: FindManyOptions<BatHo>,
  ): Promise<[BatHo[], number]> {
    return this.batHoRepository.findAndCount(options);
  }

  async retrieveById(id: string): Promise<BatHo> {
    return this.batHoRepository.findOne({
      where: [{ id }, { contractId: id }],
    });
  }

  retrieveOne(options: FindOneOptions<BatHo>): Promise<BatHo> {
    return this.batHoRepository.findOne(options);
  }

  async settlementBatHo(batHoId: string, payload: SettlementBatHoDto) {
    await this.databaseService.runTransaction(async (repositories) => {
      const {
        batHoRepository,
        paymentHistoryRepository,
        cashRepository,
        transactionHistoryRepository,
      } = repositories;

      const batHo = await batHoRepository.findOne({
        where: [{ id: batHoId }, { contractId: batHoId }],
        relations: ['user', 'customer'],
      });

      if (!batHo) {
        throw new Error('Không tìm thấy hợp đồng');
      }

      const paymentHistories = await paymentHistoryRepository.find({
        where: {
          paymentStatus: Or(Equal(PaymentStatusHistory.UNFINISH), IsNull()),
          batHoId: batHo.id,
        },
      });

      await Promise.all(
        paymentHistories.map(async (paymentHistory) => {
          await paymentHistoryRepository.update(paymentHistory.id, {
            paymentStatus: PaymentStatusHistory.FINISH,
            payDate: convertPostgresDate(payload.payDate),
            payMoney: paymentHistory.payNeed,
            isMaturity: true,
            updated_at: new Date(),
          });
        }),
      );

      const settlementMoney = paymentHistories.reduce(
        (total, paymentHistory) => total + paymentHistory.payNeed,
        0,
      );

      await transactionHistoryRepository.createPayloadAndSave({
        contract: { icloud: batHo },
        type: TransactionHistoryType.SETTLEMENT_CONTRACT,
        money: settlementMoney,
        otherMoney: 0,
        createdAt: convertPostgresDate(payload.payDate),
      });

      await batHoRepository.update(batHo.id, {
        debitStatus: DebitStatus.COMPLETED,
      });

      const amount = paymentHistories.reduce((total, paymentHistory) => {
        return total + paymentHistory.payNeed;
      }, 0);

      await cashRepository.update(
        { batHoId: batHo.id, filterType: CashFilterType.RECEIPT_CONTRACT },
        { amount },
      );

      return batHo;
    });
  }

  calculateTotalIcloud(listIcloud: BatHoResponseDto[]) {
    const totalLoanAmount = listIcloud.reduce(
      (total, icloud) => icloud.loanAmount + total,
      0,
    );

    const totalDisbursement = listIcloud.reduce(
      (total, icloud) => icloud.fundedAmount + total,
      0,
    );

    const totalRevenueReceived = listIcloud.reduce(
      (total, icloud) => icloud.revenueReceived + total,
      0,
    );

    const totalMoneyPaid = listIcloud.reduce(
      (total, icloud) => icloud.moneyPaidNumber + total,
      0,
    );

    const totalMoneyOneDay = listIcloud.reduce(
      (total, icloud) => icloud.moneyOneDay + total,
      0,
    );

    const totalMoneyMustPay = listIcloud.reduce(
      (total, icloud) => icloud.moneyMustPayNumber + total,
      0,
    );

    const totalLateMoney = listIcloud.reduce(
      (total, icloud) => icloud.latePaymentMoney + total,
      0,
    );

    const totalBadMoney = listIcloud.reduce(
      (total, icloud) => icloud.badDebitMoney + total,
      0,
    );

    const totalDeductionMoney = listIcloud.reduce(
      (total, icloud) => icloud.deductionDays * icloud.moneyOneDay + total,
      0,
    );

    return {
      totalLoanAmount,
      totalMoneyPaid,
      totalDisbursement,
      totalRevenueReceived,
      totalMoneyOneDay,
      totalMoneyMustPay,
      totalLateMoney,
      totalBadMoney,
      totalDeductionMoney,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleUpdateBatHoDebitStatus() {
    this.logger.log(
      {
        customerMessage: `Update debit status in Bat Ho date ${formatDate(new Date())}`,
      },
      null,
    );

    let total = 0;
    let updated = 0;

    const batHos = await this.list({
      where: { debitStatus: Not(DebitStatus.COMPLETED) },
    });

    total = batHos.length;

    Promise.allSettled(
      batHos.map(async (batHo) => {
        await this.batHoRepository.updateStatus(batHo.id);
        await this.contractService.updateBadDebitStatusCustomer(
          batHo.customerId,
        );
        updated++;
      }),
    );

    this.logger.log(
      {
        customerMessage: `Icloud updated: ${updated}/${total}`,
      },
      null,
    );
  }
}
