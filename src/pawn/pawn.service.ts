import { BadRequestException, Injectable } from '@nestjs/common';
import { CashFilterType, ContractType } from 'src/common/interface';
import { DebitStatus } from 'src/common/interface/bat-ho';
import { TransactionHistoryType } from 'src/common/interface/history';
import {
  PawnInterestType,
  PawnPaymentPeriodType,
} from 'src/common/interface/pawn';
import { BaseService } from 'src/common/service/base.service';
import {
  createCashContractPayload,
  createPaymentHistoriesCash,
} from 'src/common/utils/cash-payload';
import { getContentTransactionHistory } from 'src/common/utils/history';
import {
  convertPostgresDate,
  countFromToDate,
  formatDate,
} from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import { CreatePaymentHistoryDto } from 'src/payment-history/dto/create-payment-history';
import { UpdateStatusService } from 'src/update-status/update-status.service';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Not,
  Repository,
} from 'typeorm';
import { CreatePawnDto } from './dto/create-pawn.dto';
import { UpdatePawnDto } from './dto/update-pawn.dto';
import { Pawn } from './pawn.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggerServerService } from 'src/logger/logger-server.service';

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
    private updateStatusService: UpdateStatusService,
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

        const pawnCompleted = await pawnRepository.findOne({
          where: {
            customerId: payloadData.customerId,
            debitStatus: Not(DebitStatus.COMPLETED),
          },
        });

        if (pawnCompleted) {
          throw new BadRequestException(
            'Khách hàng còn hợp đồng chưa trả hết.',
          );
        }

        let newPawn = await pawnRepository.create({ ...payloadData, userId });

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

        await pawnRepository.update({ id: newPawn.id }, { revenueReceived });

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

    await this.updateStatusService.updatePawnStatus(newPawn.id);

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

    await this.updateStatusService.updatePawnStatus(pawnUpdated.id);

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

    const interestMoneyEachPeriod = this.countInterestMoneyEachPeriod(
      loanAmount,
      interestMoney,
      paymentPeriod,
      interestType,
      paymentPeriodType,
    );

    while (duration > 0) {
      const dates = countFromToDate(
        paymentPeriod,
        paymentPeriodType as any,
        skip,
        loanDate,
      );

      if (duration === 1) {
        paymentHistories.push({
          rowId: index,
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
      } else {
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
      }

      index++;
      duration -= 1;
      skip += paymentPeriod;
    }

    return paymentHistories;
  }

  countInterestMoneyEachPeriod = (
    loanAmount: number,
    interestMoney: number,
    paymentPeriod: number,
    interestType: string,
    paymentPeriodType: string,
  ) => {
    let money = 0;

    if (
      paymentPeriodType === PawnPaymentPeriodType.DAY &&
      interestType === PawnInterestType.LOAN_MIL_DAY
    ) {
      const milPeriod = Math.round(loanAmount / 1000000);
      money = milPeriod * interestMoney * paymentPeriod;
    }

    return money;
  };

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
        await this.updateStatusService.updatePawnStatus(pawn.id);
      }),
    );
  }
}
