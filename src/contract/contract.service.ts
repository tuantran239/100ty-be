import { Injectable } from '@nestjs/common';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { CashFilterType, ContractType } from 'src/common/interface';
import { DebitStatus } from 'src/common/interface/bat-ho';
import { Contract } from 'src/common/interface/contract';
import { PaymentStatusHistory } from 'src/common/interface/history';
import {
  calculateLateAndBadPaymentIcloud,
  calculateLateAndBadPaymentPawn,
} from 'src/common/utils/calculate';
import { createPaymentHistoriesCash } from 'src/common/utils/cash-payload';
import { getBatHoStatus, getPawnStatus } from 'src/common/utils/status';
import { calculateRangeTime, formatDate } from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import { Pawn } from 'src/pawn/pawn.entity';
import { Between, DataSource, Equal, FindManyOptions, IsNull } from 'typeorm';

@Injectable()
export class ContractService {
  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
  ) {}

  private mapContractData({ icloud, pawn }: { icloud?: BatHo; pawn?: Pawn }) {
    let contract: Contract;

    if (icloud) {
      const paymentHistories = icloud.paymentHistories ?? [];

      const { latePaymentDay, latePaymentMoney, badDebitMoney } =
        calculateLateAndBadPaymentIcloud(
          paymentHistories ?? [],
          icloud.debitStatus,
        );

      const moneyPaid = paymentHistories.reduce((total, paymentHistory) => {
        if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
          return (total += paymentHistory.payMoney);
        }
        return total;
      }, 0);

      const deductionMoney = paymentHistories.reduce(
        (total, paymentHistory) => {
          if (paymentHistory.isDeductionMoney) {
            return (total += paymentHistory.payMoney);
          }
          return total;
        },
        0,
      );

      contract = {
        paymentHistories: paymentHistories ?? [],
        customer: icloud.customer,
        user: icloud.user,
        contractId: icloud.contractId,
        loanDate: formatDate(icloud.loanDate),
        debitStatus: icloud.debitStatus,
        loanAmount: icloud.loanAmount,
        latePaymentMoney,
        badDebitMoney,
        rootMoney: icloud.loanAmount,
        interestMoney: icloud.revenueReceived - icloud.loanAmount,
        latePaymentDay,
        moneyMustPay: icloud.revenueReceived,
        moneyPaid,
        revenueReceived: icloud.revenueReceived,
        contractType: ContractType.BAT_HO,
        disbursementMoney: icloud.fundedAmount,
        deductionMoney,
      };
    } else if (pawn) {
      const paymentHistories = pawn.paymentHistories ?? [];
      const { latePaymentPeriod, latePaymentMoney, badDebitMoney } =
        calculateLateAndBadPaymentPawn(
          paymentHistories ?? [],
          pawn.debitStatus,
        );

      const moneyPaid = paymentHistories.reduce((total, paymentHistory) => {
        if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
          return (total += paymentHistory.payMoney);
        }
        return total;
      }, 0);

      const deductionMoney = paymentHistories.reduce(
        (total, paymentHistory) => {
          if (paymentHistory.isDeductionMoney) {
            return (total += paymentHistory.payMoney);
          }
          return total;
        },
        0,
      );

      contract = {
        paymentHistories,
        customer: pawn.customer,
        user: pawn.user,
        contractId: pawn.contractId,
        loanDate: formatDate(pawn.loanDate),
        debitStatus: pawn.debitStatus,
        loanAmount: pawn.loanAmount,
        latePaymentMoney,
        badDebitMoney,
        rootMoney: pawn.loanAmount,
        interestMoney: pawn.revenueReceived - pawn.loanAmount,
        latePaymentDay: latePaymentPeriod * pawn.paymentPeriod,
        moneyMustPay: pawn.revenueReceived,
        moneyPaid,
        revenueReceived: pawn.revenueReceived,
        contractType: ContractType.CAM_DO,
        deductionMoney,
        disbursementMoney: pawn.loanAmount,
      };
    }

    return contract;
  }

  async listContractIcloud(
    options: FindManyOptions<BatHo>,
  ): Promise<Contract[]> {
    const { batHoRepository } = this.databaseService.getRepositories();

    const iClouds = await batHoRepository.find(options);

    const icloudContracts = iClouds.map((icloud) => {
      return this.mapContractData({ icloud });
    });

    return icloudContracts;
  }

  async listContractPawn(options: FindManyOptions<Pawn>): Promise<Contract[]> {
    const { pawnRepository } = this.databaseService.getRepositories();

    const pawns = await pawnRepository.find(options);

    const pawnContracts = pawns.map((pawn) => {
      return this.mapContractData({ pawn });
    });

    return pawnContracts;
  }

  async listContract(
    contractType?: string,
    options?: FindManyOptions<any>,
  ): Promise<Contract[]> {
    let contracts: Contract[] = [];

    switch (contractType) {
      case ContractType.BAT_HO:
        {
          const icloudContracts = await this.listContractIcloud(options);

          contracts = contracts.concat(contracts, icloudContracts);
        }
        break;
      case ContractType.CAM_DO:
        {
          const pawnContracts = await this.listContractPawn(options);

          contracts = contracts.concat(contracts, pawnContracts);
        }
        break;
      default: {
        const icloudContracts = await this.listContractIcloud(options);

        const pawnContracts = await this.listContractPawn(options);

        contracts = contracts.concat(contracts, icloudContracts, pawnContracts);
      }
    }

    return contracts;
  }

  async listBadDebitContractCustomer(customerId: string, user?: any) {
    const { customerRepository } = this.databaseService.getRepositories();

    const customer = await customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      return {
        total: 0,
        contracts: [],
      };
    }

    const contracts = await this.listContract(null, {
      where: {
        user,
        deleted_at: IsNull(),
        customer: {
          id: customer.id,
        },
        debitStatus: Equal(DebitStatus.BAD_DEBIT),
      },
      relations: ['paymentHistories', 'customer', 'user'],
    });

    const total = contracts.reduce((total, contract) => {
      return total + contract.badDebitMoney;
    }, 0);

    return {
      total,
      contracts,
    };
  }

  async updateBatHoStatus(batHoId: string) {
    await this.databaseService.runTransaction(async (repositories) => {
      const { batHoRepository, paymentHistoryRepository, cashRepository } =
        repositories;

      const batHo = await batHoRepository.findOne({
        where: { id: batHoId },
        relations: ['paymentHistories'],
      });

      if (batHo) {
        const status = getBatHoStatus(batHo.paymentHistories ?? []);

        await batHoRepository.update({ id: batHo.id }, { debitStatus: status });

        const findPaymentHistories = await paymentHistoryRepository.find({
          where: { batHoId: batHo.id },
        });

        const cash = await cashRepository.findOne({
          where: { batHoId, filterType: CashFilterType.RECEIPT_CONTRACT },
        });

        if (cash) {
          cash.contractStatus = status;

          cash.paymentHistories = createPaymentHistoriesCash(
            findPaymentHistories ?? [],
          );

          await cashRepository.save(cash);
        }
      }
    });

    await this.databaseService.runTransaction(async (repositories) => {
      const { batHoRepository, customerRepository } = repositories;

      const batHo = await batHoRepository.findOne({
        where: { id: batHoId },
      });

      if (batHo) {
        const customer = await customerRepository.findOne({
          where: { id: batHo.customerId },
        });

        const customerBadDebitContract =
          await this.listBadDebitContractCustomer(customer.id);

        await customerRepository.update(customer.id, {
          debtMoney: customerBadDebitContract.total,
          isDebt: customerBadDebitContract.total !== 0,
        });
      }
    });
  }

  async updatePawnStatus(pawnId: string) {
    await this.databaseService.runTransaction(async (repositories) => {
      const { pawnRepository, paymentHistoryRepository, cashRepository } =
        repositories;

      const pawn = await pawnRepository.findOne({
        where: { id: pawnId },
        relations: ['paymentHistories'],
      });

      if (pawn) {
        const status = getPawnStatus(pawn.paymentHistories ?? []);

        await pawnRepository.update({ id: pawn.id }, { debitStatus: status });

        const findPaymentHistories = await paymentHistoryRepository.find({
          where: { pawnId: pawn.id },
        });

        const cash = await cashRepository.findOne({
          where: { pawnId, filterType: CashFilterType.RECEIPT_CONTRACT },
        });

        if (cash) {
          cash.contractStatus = status;

          cash.paymentHistories = createPaymentHistoriesCash(
            findPaymentHistories ?? [],
          );

          await cashRepository.save(cash);
        }
      }
    });

    await this.databaseService.runTransaction(async (repositories) => {
      const { pawnRepository, customerRepository } = repositories;

      const pawn = await pawnRepository.findOne({
        where: { id: pawnId },
      });

      if (pawn) {
        const customer = await customerRepository.findOne({
          where: { id: pawn.customerId },
        });

        const customerBadDebitContract =
          await this.listBadDebitContractCustomer(customer.id);

        await customerRepository.update(customer.id, {
          debtMoney: customerBadDebitContract.total,
          isDebt: customerBadDebitContract.total !== 0,
        });
      }
    });
  }

  async updateStatusContract(contractType?: string) {
    let total = 0;
    let updated = 0;

    const { batHoRepository, pawnRepository } =
      this.databaseService.getRepositories();

    if (contractType === ContractType.BAT_HO) {
      const icloudContracts = await batHoRepository.find({
        where: { deleted_at: IsNull() },
      });

      total = icloudContracts.length;

      await Promise.allSettled(
        icloudContracts.map(async (icloudContract) => {
          await this.updateBatHoStatus(icloudContract.id);
          updated++;
        }),
      );
    } else if (contractType === ContractType.CAM_DO) {
      const pawnContracts = await pawnRepository.find({
        where: { deleted_at: IsNull() },
      });

      total = pawnContracts.length;

      await Promise.allSettled(
        pawnContracts.map(async (pawnContract) => {
          await this.updatePawnStatus(pawnContract.id);
          updated++;
        }),
      );
    } else {
      const icloudContracts = await batHoRepository.find({
        where: { deleted_at: IsNull() },
      });

      const pawnContracts = await pawnRepository.find({
        where: { deleted_at: IsNull() },
      });

      total = pawnContracts.length + icloudContracts.length;

      await Promise.allSettled(
        icloudContracts.map(async (icloudContract) => {
          await this.updateBatHoStatus(icloudContract.id);
          updated++;
        }),
      );

      await Promise.allSettled(
        pawnContracts.map(async (pawnContract) => {
          await this.updatePawnStatus(pawnContract.id);
          updated++;
        }),
      );
    }

    return { updated: `${updated}/${total}` };
  }

  async listNewContractToday() {
    const today = new Date();

    const relations = [
      'paymentHistories',
      'transactionHistories',
      'user',
      'customer',
    ];

    const { fromDate, toDate } = calculateRangeTime(
      {
        day: today.getDate(),
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      },
      'day',
    );

    return await this.listContract(undefined, {
      where: { created_at: Between(fromDate, toDate) },
      relations,
    });
  }

  async summarizeContractAmounts(options?: FindManyOptions<any>) {
    const relations = [
      'paymentHistories',
      'transactionHistories',
      'user',
      'customer',
    ];

    const contracts = await this.listContract(undefined, {
      ...options,
      relations,
    });

    const disbursementMoneyTotal = contracts.reduce(
      (total, contract) => total + contract.disbursementMoney,
      0,
    );

    return { disbursementMoneyTotal };
  }

  async listContractMustReceiptRangeTime(
    fromDate: string,
    toDate: string,
    user?: any,
  ) {
    const relations = [
      'paymentHistories',
      'transactionHistories',
      'user',
      'customer',
    ];

    const pawnContracts = await this.listContractPawn({
      where: {
        user,
        paymentHistories: {
          endDate: Between(fromDate, toDate),
        },
      },
      relations,
    });

    const icloudContracts = await this.listContractIcloud({
      where: {
        user,
        paymentHistories: {
          startDate: Between(fromDate, toDate),
        },
      },
      relations,
    });

    return [...pawnContracts, ...icloudContracts];
  }
}
