import { Injectable } from '@nestjs/common';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { ContractInitLabel } from 'src/common/constant/contract';
import { ContractType } from 'src/common/interface';
import { DebitStatus } from 'src/common/interface/bat-ho';
import {
  Contract,
  SummarizeContract,
  SummarizeContractAmountDetail,
  SummarizeContractRangeTime,
  SummarizeContractType,
} from 'src/common/interface/contract';
import {
  PaymentHistoryType,
  PaymentStatusHistory,
  TransactionHistoryType,
} from 'src/common/interface/history';
import {
  calculateInterestMoneyOfOneDay,
  calculateLateAndBadPaymentIcloud,
  calculateLateAndBadPaymentPawn,
  calculateMoneyBadDebit,
  calculateMoneyCompleted,
  calculateMoneyInDebit,
  calculateReduceTotal,
} from 'src/common/utils/calculate';
import { mapUniqueArray } from 'src/common/utils/map';
import { getBatHoStatus, getPawnStatus } from 'src/common/utils/status';
import { calculateRangeTime, formatDate } from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import { Pawn } from 'src/pawn/pawn.entity';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
import { Between, DataSource, Equal, FindManyOptions, IsNull } from 'typeorm';

@Injectable()
export class ContractService {
  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
  ) {}

  private mapSummarizeContract(
    paymentHistories: PaymentHistory[],
    transactionHistories: TransactionHistory[],
  ): SummarizeContract {
    const expectedInterestMoney = paymentHistories.reduce(
      (total, paymentHistory) => {
        if (paymentHistory.type === PaymentHistoryType.INTEREST_MONEY) {
          total += paymentHistory.payNeed;
        }
        return total;
      },
      0,
    );

    const expectedRootMoney = paymentHistories.reduce(
      (total, paymentHistory) => {
        if (paymentHistory.type === PaymentHistoryType.ROOT_MONEY) {
          total += paymentHistory.payNeed;
        }
        return total;
      },
      0,
    );

    const loanDisbursementMoney = transactionHistories.reduce(
      (total, transactionHistory) => {
        if (
          transactionHistory.type ===
          TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT
        ) {
          total += transactionHistory.moneySub;
        }
        return total;
      },
      0,
    );

    const loanMoreMoney = transactionHistories.reduce(
      (total, transactionHistory) => {
        if (
          transactionHistory.type === TransactionHistoryType.LOAN_MORE_MONEY
        ) {
          total += transactionHistory.moneySub;
        }
        return total;
      },
      0,
    );

    const loanOtherMoney = transactionHistories.reduce(
      (total, transactionHistory) => {
        if (
          transactionHistory.type === TransactionHistoryType.LOAN_MORE_MONEY
        ) {
          total += transactionHistory.otherMoney;
        }
        return total;
      },
      0,
    );

    const receiptInterestMoney = paymentHistories.reduce(
      (total, paymentHistory) => {
        if (
          paymentHistory.type === PaymentHistoryType.INTEREST_MONEY &&
          paymentHistory.paymentStatus === PaymentStatusHistory.FINISH
        ) {
          total += paymentHistory.payMoney;
        }
        return total;
      },
      0,
    );

    const receiptDeductionMoney = paymentHistories.reduce(
      (total, paymentHistory) => {
        if (
          paymentHistory.type === PaymentHistoryType.DEDUCTION_MONEY &&
          paymentHistory.paymentStatus === PaymentStatusHistory.FINISH
        ) {
          total += paymentHistory.payMoney;
        }
        return total;
      },
      0,
    );

    const receiptDownRootMoney = transactionHistories.reduce(
      (total, transactionHistory) => {
        if (
          transactionHistory.type ===
          TransactionHistoryType.PAYMENT_DOWN_ROOT_MONEY
        ) {
          total += transactionHistory.moneyAdd;
        }
        return total;
      },
      0,
    );

    const receiptMoney = paymentHistories.reduce((total, paymentHistory) => {
      if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
        total += paymentHistory.payMoney;
      }
      return total;
    }, 0);

    const receiptOtherMoney = paymentHistories.reduce(
      (total, paymentHistory) => {
        if (
          paymentHistory.type === PaymentHistoryType.OTHER_MONEY_DOWN_ROOT ||
          (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH &&
            paymentHistory.type === PaymentHistoryType.OTHER_MONEY_LOAN_MORE)
        ) {
          total += paymentHistory.payMoney;
        }
        return total;
      },
      0,
    );

    const summarizeContract: SummarizeContract = {
      expected: {
        interestMoney: expectedInterestMoney,
        rootMoney: expectedRootMoney,
        interestMoneyOneDay: 0,
      },
      loan: {
        disbursementMoney: loanDisbursementMoney,
        otherMoney: loanOtherMoney,
        moreMoney: loanMoreMoney,
      },
      receipt: {
        interestMoney: receiptInterestMoney,
        downRootMoney: receiptDownRootMoney,
        otherMoney: receiptOtherMoney,
        deductionMoney: receiptDeductionMoney,
        receiptMoney: receiptMoney,
      },
    };

    return summarizeContract;
  }

  private mapContractData({ icloud, pawn }: { icloud?: BatHo; pawn?: Pawn }) {
    let contract: Contract;

    if (icloud) {
      const paymentHistories = icloud.paymentHistories ?? [];
      const transactionHistories = icloud.transactionHistories ?? [];

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

      const summarize = this.mapSummarizeContract(
        paymentHistories,
        transactionHistories,
      );

      summarize.expected.interestMoneyOneDay =
        paymentHistories[0]?.payNeed ?? 0;

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
        summarize,
        settlementDate: icloud.maturityDate,
      };
    } else if (pawn) {
      const paymentHistories = pawn.paymentHistories ?? [];
      const transactionHistories = pawn.transactionHistories ?? [];

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

      const summarize = this.mapSummarizeContract(
        paymentHistories,
        transactionHistories,
      );

      const interestMoneyOneDay = calculateInterestMoneyOfOneDay(
        pawn.loanAmount,
        pawn.interestMoney,
        pawn.paymentPeriod,
        pawn.interestType,
      );

      summarize.expected.interestMoneyOneDay = interestMoneyOneDay;

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
        summarize,
        settlementDate: pawn.settlementDate,
      };
    }

    return contract;
  }

  async listContractIcloud(
    options: FindManyOptions<BatHo>,
  ): Promise<Contract[]> {
    const { batHoRepository } = this.databaseService.getRepositories();

    const iClouds = await batHoRepository.find({
      ...options,
      relations: [
        'paymentHistories',
        'transactionHistories',
        'customer',
        'user',
      ],
    });

    const icloudContracts = iClouds.map((icloud) => {
      return this.mapContractData({ icloud });
    });

    return icloudContracts;
  }

  async listContractPawn(options: FindManyOptions<Pawn>): Promise<Contract[]> {
    const { pawnRepository } = this.databaseService.getRepositories();

    const pawns = await pawnRepository.find({
      ...options,
      relations: [
        'paymentHistories',
        'transactionHistories',
        'customer',
        'user',
      ],
    });

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
      const { batHoRepository } = repositories;

      const batHo = await batHoRepository.findOne({
        where: { id: batHoId },
        relations: ['paymentHistories'],
      });

      if (batHo) {
        const status = getBatHoStatus(batHo.paymentHistories ?? []);

        await batHoRepository.update({ id: batHo.id }, { debitStatus: status });
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
      const { pawnRepository } = repositories;

      const pawn = await pawnRepository.findOne({
        where: { id: pawnId },
        relations: ['paymentHistories'],
      });

      if (pawn) {
        const status = getPawnStatus(pawn.paymentHistories ?? []);

        await pawnRepository.update({ id: pawn.id }, { debitStatus: status });
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

  private mapToSummarizeContractType(contracts: Contract[]) {
    const listContractInDebit = contracts.filter(
      (contract) => contract.debitStatus === DebitStatus.IN_DEBIT,
    );

    const listContractBadDebit = contracts.filter(
      (contract) => contract.debitStatus === DebitStatus.BAD_DEBIT,
    );

    const listContractCompleted = contracts.filter(
      (contract) => contract.debitStatus === DebitStatus.COMPLETED,
    );

    const contractInDebit = {
      contracts: listContractInDebit.length ?? 0,
      amount: listContractInDebit.reduce((total, contract) => {
        return total + calculateMoneyInDebit(contract.paymentHistories ?? []);
      }, 0),
    };

    const contractBadDebit = {
      contracts: listContractBadDebit.length ?? 0,
      amount: listContractBadDebit.reduce((total, contract) => {
        return total + calculateMoneyBadDebit(contract.paymentHistories ?? []);
      }, 0),
    };

    const contractCompleted = {
      contracts: listContractCompleted.length ?? 0,
      amount: listContractCompleted.reduce((total, contract) => {
        return total + calculateMoneyCompleted(contract);
      }, 0),
    };

    const expected = {
      interestMoney: calculateReduceTotal(
        contracts,
        'summarize.expected.interestMoney',
      ),
      rootMoney: calculateReduceTotal(
        contracts,
        'summarize.expected.rootMoney',
      ),
      interestMoneyOneDay: calculateReduceTotal(
        contracts,
        'summarize.expected.interestMoneyOneDay',
      ),
    };

    const loan = {
      disbursementMoney: calculateReduceTotal(
        contracts,
        'summarize.loan.disbursementMoney',
      ),
      otherMoney: calculateReduceTotal(contracts, 'summarize.loan.otherMoney'),
      moreMoney: calculateReduceTotal(contracts, 'summarize.loan.moreMoney'),
    };

    const receipt = {
      interestMoney: calculateReduceTotal(
        contracts,
        'summarize.receipt.interestMoney',
      ),
      downRootMoney: calculateReduceTotal(
        contracts,
        'summarize.receipt.downRootMoney',
      ),
      otherMoney: calculateReduceTotal(
        contracts,
        'summarize.receipt.otherMoney',
      ),
      deductionMoney: calculateReduceTotal(
        contracts,
        'summarize.receipt.deductionMoney',
      ),
      receiptMoney: calculateReduceTotal(
        contracts,
        'summarize.receipt.receiptMoney',
      ),
    };

    const summarizeContractType: SummarizeContractType = {
      contractBadDebit,
      contractInDebit,
      contractCompleted,
      expected,
      loan,
      receipt,
    };

    return summarizeContractType;
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

    const allContract = {
      total: contracts.length,
      summarizeDetail: this.mapToSummarizeContractType(contracts),
    };

    const details: SummarizeContractAmountDetail[] = [];

    const valuesContractType = Object.values(ContractType);

    for (let i = 0; i < valuesContractType.length; i++) {
      const value = valuesContractType[i];

      const summarizeDetail = this.mapToSummarizeContractType(
        contracts.filter(
          (contract) => contract.contractType === valuesContractType[i],
        ),
      );

      details.push({
        label: ContractInitLabel[value],
        contractType: value,
        summarizeDetail,
        total: contracts.filter(
          (contract) => contract.contractType === valuesContractType[i],
        ).length,
      });
    }

    return { allContract, details };
  }

  async summarizeContractRangeTime(
    fromDate: string,
    toDate: string,
    user?: any,
  ) {
    const { paymentHistoryRepository, transactionHistoryRepository } =
      this.databaseService.getRepositories();

    const paymentHistories = await paymentHistoryRepository.find({
      where: [
        {
          endDate: Between(fromDate, toDate),
          user,
          contractType: ContractType.CAM_DO,
        },
        {
          startDate: Between(fromDate, toDate),
          user,
          contractType: ContractType.BAT_HO,
        },
      ],
    });

    const transactionHistories = await transactionHistoryRepository.find({
      where: { user, createdAt: Between(fromDate, toDate) },
    });

    const listContractId = [
      ...paymentHistories.map((paymentHistory) => paymentHistory.contractId),
      ...transactionHistories.map(
        (transactionHistory) => transactionHistory.contractId,
      ),
    ];

    const allContract = {
      total: mapUniqueArray<string>(listContractId).length ?? 0,
      summarizeDetail: this.mapSummarizeContract(
        paymentHistories,
        transactionHistories,
      ),
    };

    const details: Array<{
      label: string;
      contractType: string;
      summarizeDetail: SummarizeContract;
      total: number;
    }> = [];

    const valuesContractType = Object.values(ContractType);

    for (let i = 0; i < valuesContractType.length; i++) {
      const value = valuesContractType[i];

      const paymentHistoriesType = paymentHistories.filter(
        (paymentHistory) =>
          paymentHistory.contractType === valuesContractType[i],
      );

      const transactionHistoriesType = transactionHistories.filter(
        (transactionHistory) =>
          transactionHistory.contractType === valuesContractType[i],
      );

      const summarizeDetail = this.mapSummarizeContract(
        paymentHistoriesType,
        transactionHistoriesType,
      );

      const listContractIdType = [
        ...paymentHistoriesType.map(
          (paymentHistory) => paymentHistory.contractId,
        ),
        ...transactionHistoriesType.map(
          (transactionHistory) => transactionHistory.contractId,
        ),
      ];

      details.push({
        label: ContractInitLabel[value],
        contractType: value,
        summarizeDetail,
        total: mapUniqueArray<string>(listContractIdType).length ?? 0,
      });
    }

    const summarizeContractRangeTime: SummarizeContractRangeTime = {
      allContract,
      details,
    };

    return summarizeContractRangeTime;
  }
}
