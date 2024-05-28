import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CASH_CODE_PREFIX } from 'src/cash/cash.controller';
import { CashFilterType, CashType, ContractType } from 'src/common/interface';
import { DebitStatus } from 'src/common/interface/bat-ho';
import {
  PaymentHistoryType,
  PaymentStatusHistory,
  TransactionHistoryType,
} from 'src/common/interface/history';
import { BaseService } from 'src/common/service/base.service';
import {
  createCashContractPayload,
  createPaymentHistoriesCash,
} from 'src/common/utils/cash-payload';
import { generatePrefixNumberId } from 'src/common/utils/generated-id';
import { getFullName } from 'src/common/utils/get-full-name';
import { getContentTransactionHistory } from 'src/common/utils/history';
import {
  convertPostgresDate,
  countFromToDate,
  formatDate,
} from 'src/common/utils/time';
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
import { BatHo } from './bat-ho.entity';
import { CreateBatHoDto } from './dto/create-bat-ho.dto';
import { SettlementBatHoDto } from './dto/settlement-bat-ho.dto';
import { UpdateBatHoDto } from './dto/update-bat-ho.dto';
import { ContractService } from 'src/contract/contract.service';

@Injectable()
export class BatHoService extends BaseService<
  BatHo,
  CreateBatHoDto,
  UpdateBatHoDto
> {
  protected manager: EntityManager;
  private batHoRepository: Repository<BatHo>;
  constructor(
    private dataSource: DataSource,
    private logger: LoggerServerService,
    private contractService: ContractService,
    private databaseService: DatabaseService,
  ) {
    super();
    this.manager = this.dataSource.manager;
    this.batHoRepository = this.dataSource.manager.getRepository(BatHo);
  }

  async createTransaction(payload: CreateBatHoDto, userId: string) {
    const { customerId, customer } = payload;
    const newBatHo = await this.databaseService.runTransaction(
      async (repositories) => {
        const {
          batHoRepository,
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

        const batHoContract = await batHoRepository.findOne({
          where: { contractId: payload.contractId },
        });

        if (batHoContract) {
          throw new BadRequestException('Mã hợp đồng đã tồn tại.');
        }

        const batHoNotCompleted = await batHoRepository.findOne({
          where: {
            customerId: payloadData.customerId,
            debitStatus: Not(DebitStatus.COMPLETED),
          },
        });

        if (batHoNotCompleted) {
          throw new BadRequestException(
            'Khách hàng còn hợp đồng chưa trả hết.',
          );
        }

        let newBatHo = await batHoRepository.create({ ...payloadData, userId });

        newBatHo = await batHoRepository.save(newBatHo);

        const paymentHistories = await this.countBatHoPaymentHistory(
          newBatHo,
          userId,
        );

        const deductionPaymentHistories = paymentHistories.filter(
          (paymentHistory) => paymentHistory.isDeductionMoney,
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

        const deductionMoney = paymentHistories.reduce(
          (total, paymentHistory) => {
            if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
              return total + paymentHistory.payMoney;
            }
            return total;
          },
          0,
        );

        const user = await userRepository.findOne({ where: { id: userId } });

        const newCashDeduction = await cashRepository.create(
          createCashContractPayload(
            user,
            payload.customer as any,
            CashFilterType.DEDUCTION,
            {
              id: newBatHo.id,
              amount: deductionMoney,
              date: formatDate(newBatHo.loanDate),
              contractType: ContractType.BAT_HO,
              contractId: newBatHo.contractId,
            },
          ),
        );

        await cashRepository.save(newCashDeduction);

        const newCashPaymentContract = await cashRepository.create(
          createCashContractPayload(
            user,
            payload.customer as any,
            CashFilterType.PAYMENT_CONTRACT,
            {
              id: newBatHo.id,
              amount: payload.fundedAmount,
              date: formatDate(newBatHo.loanDate),
              contractType: ContractType.BAT_HO,
              contractId: newBatHo.contractId,
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
              id: newBatHo.id,
              amount: 0,
              date: formatDate(newBatHo.loanDate),
              contractType: ContractType.BAT_HO,
              contractId: newBatHo.contractId,
            },
          ),
          paymentHistories: createPaymentHistoriesCash(newPaymentHistories),
          contractId: newBatHo.contractId,
          contractStatus: newBatHo.debitStatus,
        });

        await cashRepository.save(newCashReceipt);

        const newTransactionHistory = await transactionHistoryRepository.create(
          {
            userId,
            batHoId: newBatHo.id,
            contractId: newBatHo.contractId,
            type: TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT,
            content: getContentTransactionHistory(
              TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT,
              newBatHo.contractId,
            ),
            moneySub: newBatHo.fundedAmount,
            moneyAdd: 0,
            otherMoney: 0,
            createAt: convertPostgresDate(newBatHo.loanDate),
          },
        );

        await transactionHistoryRepository.save(newTransactionHistory);

        await Promise.all(
          deductionPaymentHistories.map(async (paymentHistory) => {
            const newDeductionTransactionHistory =
              await transactionHistoryRepository.create({
                userId,
                batHoId: newBatHo.id,
                contractId: newBatHo.contractId,
                type: TransactionHistoryType.DEDUCTION_MONEY,
                content: getContentTransactionHistory(
                  TransactionHistoryType.DEDUCTION_MONEY,
                  newBatHo.contractId,
                ),
                moneySub: 0,
                moneyAdd: paymentHistory.payMoney,
                otherMoney: 0,
                createAt: convertPostgresDate(newBatHo.loanDate),
              });

            await transactionHistoryRepository.save(
              newDeductionTransactionHistory,
            );
          }),
        );

        return newBatHo;
      },
    );

    await this.contractService.updateBatHoStatus(newBatHo.id);

    return newBatHo;
  }

  async create(payload: CreateBatHoDto): Promise<BatHo> {
    const newBatHo = await this.batHoRepository.create(payload);
    return await this.batHoRepository.save(newBatHo);
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

        const batHo = await batHoRepository.findOne({
          where: [{ id }, { contractId: id }],
        });

        if (!batHo) {
          throw new Error('Không tìm thấy hợp đồng');
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

        if (payload.contractId && payload.contractId !== batHo.contractId) {
          const batHoContractId = await this.batHoRepository.findOne({
            where: [{ contractId: payload.contractId }],
          });

          if (batHoContractId && batHo.id !== batHoContractId.id) {
            throw new Error('Mã hợp đồng đã tồn tại');
          }
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

          const paymentHistories = await this.countBatHoPaymentHistory(
            batHo,
            batHo.userId,
          );

          const deductionPaymentHistories = paymentHistories.filter(
            (paymentHistory) => paymentHistory.isDeductionMoney,
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
              paymentHistories: createPaymentHistoriesCash(newPaymentHistories),
              contractId: payload.contractId,
              contractStatus: batHo.debitStatus,
            },
          );

          const newTransactionHistory =
            await transactionHistoryRepository.create({
              userId: batHo.userId,
              batHoId: batHo.id,
              contractId: batHo.contractId,
              type: TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT,
              content: getContentTransactionHistory(
                TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT,
                batHo.contractId,
              ),
              moneySub: batHo.fundedAmount,
              moneyAdd: 0,
              otherMoney: 0,
              createAt: batHo.loanDate,
            });

          await transactionHistoryRepository.save(newTransactionHistory);

          await Promise.all(
            deductionPaymentHistories.map(async (paymentHistory) => {
              const newDeductionTransactionHistory =
                await transactionHistoryRepository.create({
                  userId: batHo.userId,
                  batHoId: batHo.id,
                  contractId: batHo.contractId,
                  type: TransactionHistoryType.DEDUCTION_MONEY,
                  content: getContentTransactionHistory(
                    TransactionHistoryType.DEDUCTION_MONEY,
                    batHo.contractId,
                  ),
                  moneySub: 0,
                  moneyAdd: paymentHistory.payMoney,
                  otherMoney: 0,
                  createAt: batHo.loanDate,
                });

              await transactionHistoryRepository.save(
                newDeductionTransactionHistory,
              );
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

    await this.contractService.updateBatHoStatus(batHoUpdated.id);

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

  async countBatHoPaymentHistory(
    batHo: BatHo,
    userId: string,
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
        userId,
        contractId: contractId,
        startDate: convertPostgresDate(formatDate(dates[0])),
        endDate: convertPostgresDate(formatDate(dates[1])),
        paymentMethod,
        payMoney: 0,
        payNeed: revenueReceived,
        paymentStatus: null,
        contractType: ContractType.BAT_HO,
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
        userId,
        contractId: contractId,
        startDate: convertPostgresDate(formatDate(dates[0])),
        endDate: convertPostgresDate(formatDate(dates[1])),
        paymentMethod,
        payMoney: 0,
        payNeed: numOfDay * moneyLoan,
        paymentStatus: null,
        contractType: ContractType.BAT_HO,
        type: PaymentHistoryType.INTEREST_MONEY,
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
  }

  async checkUpdateBatHoDebitStatus() {
    const batHos = await this.list({});

    Promise.allSettled(
      batHos.map(async (batHo) => {
        await this.contractService.updateBatHoStatus(batHo.id);
      }),
    );
  }

  async settlementBatHo(batHoId: string, payload: SettlementBatHoDto) {
    await this.databaseService.runTransaction(async (repositories) => {
      const { batHoRepository, paymentHistoryRepository, cashRepository } =
        repositories;

      const batHo = await batHoRepository.findOne({
        where: [{ id: batHoId }, { contractId: batHoId }],
        relations: ['user', 'customer'],
      });

      if (!batHo) {
        throw new Error('Không tìm thấy hợp đồng');
      }

      const paymentHistories = await paymentHistoryRepository.find({
        where: {
          paymentStatus: Or(Equal(false), IsNull()),
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

      await batHoRepository.update(batHo.id, {
        debitStatus: DebitStatus.COMPLETED,
      });

      const cash = await cashRepository.findOne({
        where: {
          batHoId: batHo.id,
          filterType: CashFilterType.RECEIPT_CONTRACT,
        },
      });

      const amount = paymentHistories.reduce((total, paymentHistory) => {
        return total + paymentHistory.payNeed;
      }, 0);

      cash.amount = cash.amount + amount;
      cash.contractStatus = DebitStatus.COMPLETED;

      const findPaymentHistories = await paymentHistoryRepository.find({
        where: { batHoId: batHo.id },
      });

      cash.paymentHistories = createPaymentHistoriesCash(
        findPaymentHistories ?? [],
      );

      await cashRepository.save(cash);

      return batHo;
    });
  }

  async groupCashBatHo() {
    return await this.databaseService.runTransaction(async (repositories) => {
      const { batHoRepository, cashRepository } = repositories;

      const batHos = await batHoRepository.find({
        relations: ['customer', 'user'],
      });

      await Promise.all(
        batHos.map(async (batHo) => {
          const list_cash = await cashRepository.find({
            where: { isContract: true, batHoId: batHo.id },
          });

          const cashPayload = {
            staff: batHo?.user?.fullName ?? batHo?.user?.username,
            traders:
              getFullName(
                batHo?.customer?.firstName,
                batHo?.customer?.lastName,
              ) ?? '',
            type: CashType.PAYMENT,
            createAt: convertPostgresDate(formatDate(batHo.loanDate)),
            code: generatePrefixNumberId(CASH_CODE_PREFIX),
            batHoId: batHo.id,
            isContract: true,
            contractType: ContractType.BAT_HO,
          };

          const paymentMoney = list_cash.reduce((total, cash) => {
            if (cash.type == CashType.PAYMENT) {
              return total + cash.amount;
            }
            return total;
          }, 0);

          const receiptMoney = list_cash.reduce((total, cash) => {
            if (cash.type == CashType.RECEIPT) {
              return total + cash.amount;
            }
            return total;
          }, 0);

          await cashRepository.delete({ batHoId: batHo.id });

          const paymentCash = await cashRepository.create({
            ...cashPayload,
            amount: paymentMoney,
            type: CashType.PAYMENT,
          });

          await cashRepository.save(paymentCash);

          const receiptCash = await cashRepository.create({
            ...cashPayload,
            amount: receiptMoney,
            type: CashType.RECEIPT,
          });

          await cashRepository.save(receiptCash);
        }),
      );
    });
  }

  async separateDeductionCashBatHo() {
    return await this.databaseService.runTransaction(async (repositories) => {
      const { batHoRepository, cashRepository } = repositories;

      const batHos = await batHoRepository.find({
        relations: ['customer', 'user', 'paymentHistories'],
      });

      await Promise.all(
        batHos.map(async (batHo) => {
          const cash = await cashRepository.findOne({
            where: {
              isContract: true,
              batHoId: batHo.id,
              type: CashType.RECEIPT,
            },
          });

          const deductionMoney = batHo.paymentHistories.reduce(
            (total, paymentHistory) => {
              if (paymentHistory.isDeductionMoney === true) {
                return total + paymentHistory.payMoney;
              }
              return total;
            },
            0,
          );

          const newCashDeduction = await cashRepository.create({
            staff: batHo?.user?.fullName ?? batHo?.user?.username,
            traders:
              getFullName(
                batHo?.customer?.firstName,
                batHo?.customer?.lastName,
              ) ?? '',
            type: CashType.RECEIPT,
            createAt: convertPostgresDate(formatDate(batHo.loanDate)),
            code: generatePrefixNumberId(CASH_CODE_PREFIX),
            batHoId: batHo.id,
            isContract: true,
            contractType: ContractType.BAT_HO,
            isDeductionMoney: true,
            amount: deductionMoney,
          });

          await cashRepository.save(newCashDeduction);

          cash.amount = cash.amount - deductionMoney;

          await cashRepository.save(cash);
        }),
      );
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleUpdateBatHoDebitStatus() {
    this.logger.log(
      {
        customerMessage: `Update debit status in Bat Ho date ${formatDate(new Date())}`,
      },
      null,
    );

    const batHos = await this.list({
      where: { debitStatus: Not(DebitStatus.COMPLETED) },
    });

    Promise.allSettled(
      batHos.map(async (batHo) => {
        await this.contractService.updateBatHoStatus(batHo.id);
      }),
    );
  }
}
