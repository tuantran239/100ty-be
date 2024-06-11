import { Injectable } from '@nestjs/common';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { Cash } from 'src/cash/cash.entity';
import { GroupCashId } from 'src/common/constant/group-cash';
import {
  CashFilterType,
  CashType,
  ContractType,
  GroupCashStatus,
  RoleId,
  StatisticsContractFilter,
} from 'src/common/interface';
import { DebitStatus } from 'src/common/interface/bat-ho';
import { Contract } from 'src/common/interface/contract';
import {
  PaymentStatusHistory,
  TransactionHistoryType,
} from 'src/common/interface/history';
import {
  ProfitChartDetail,
  ProfitChartDetailItem,
  ProfitStatistics,
} from 'src/common/interface/profit';
import {
  ContractHomePreviewResponses,
  HomePreview,
  HomePreviewContractResponse,
  OverViewHomeToday,
  PieChartStatisticsNewHomePreview,
  StatisticNewHomePreview,
  StatisticsOverview,
  TableStatisticsNewHomePreview,
} from 'src/common/interface/statistics';
import { calculatePercent, calculateProfit } from 'src/common/utils/calculate';
import { filterRole } from 'src/common/utils/filter-role';
import {
  calculateRangeDate,
  calculateRangeTime,
  convertPrefixTime,
  formatDate,
  getTotalDayInMonth,
} from 'src/common/utils/time';
import { ContractService } from 'src/contract/contract.service';
import { Customer } from 'src/customer/customer.entity';
import { DatabaseService } from 'src/database/database.service';
import { User } from 'src/user/user.entity';
import { Between, DataSource, IsNull, Repository } from 'typeorm';
import { StatisticsContractQueryDto } from './dto/statistics-contract-query.dto';

@Injectable()
export class StatisticsService {
  private batHoRepository: Repository<BatHo>;
  private cashRepository: Repository<Cash>;
  private customerRepository: Repository<Customer>;
  private userRepository: Repository<User>;

  constructor(
    private dataSource: DataSource,
    private contractService: ContractService,
    private databaseService: DatabaseService,
  ) {
    this.batHoRepository = this.dataSource.manager.getRepository(BatHo);
    this.cashRepository = this.dataSource.manager.getRepository(Cash);
    this.customerRepository = this.dataSource.manager.getRepository(Customer);
    this.userRepository = this.dataSource.manager.getRepository(User);
  }

  private calculateHomePreviewContractResponse(
    listContract: Contract[],
  ): HomePreviewContractResponse {
    const badDebitMoneyTotal = listContract.reduce((total, contract) => {
      return total + contract.badDebitMoney;
    }, 0);

    const contractInDebitTotal = listContract.reduce((total, contract) => {
      if (contract.debitStatus === DebitStatus.IN_DEBIT) {
        return total + 1;
      }
      return total;
    }, 0);

    const contractCompleteTotal = listContract.reduce((total, contract) => {
      if (contract.debitStatus === DebitStatus.COMPLETED) {
        return total + 1;
      }
      return total;
    }, 0);

    const contractBadDebitTotal = listContract.reduce((total, contract) => {
      if (contract.debitStatus === DebitStatus.BAD_DEBIT) {
        return total + 1;
      }
      return total;
    }, 0);

    const expectedRevenue = listContract.reduce((total, contract) => {
      return total + contract.revenueReceived;
    }, 0);

    const receiptContract = listContract.reduce((total, contract) => {
      return total + contract.moneyPaid;
    }, 0);

    const paymentContractTotal = listContract.reduce((total, contract) => {
      return total + contract.disbursementMoney;
    }, 0);

    const rootMoneyTotal = listContract.reduce((total, contract) => {
      return total + contract.rootMoney;
    }, 0);

    const interestMoneyTotal = listContract.reduce((total, contract) => {
      return total + contract.interestMoney;
    }, 0);

    const deductionMoneyTotal = listContract.reduce((total, contract) => {
      return total + contract.deductionMoney;
    }, 0);

    return {
      badDebitMoneyTotal,
      contractInDebitTotal,
      contractBadDebitTotal,
      contractCompleteTotal,
      expectedRevenue,
      receiptContract,
      paymentContractTotal,
      rootMoneyTotal,
      interestMoneyTotal,
      deductionMoneyTotal,
    };
  }

  private async getHomePreviewContractResponse(
    user?: any,
  ): Promise<ContractHomePreviewResponses> {
    const options = {
      where: {
        user,
        deleted_at: IsNull(),
      },
      relations: ['paymentHistories', 'customer', 'user'],
    };

    const listIcloudContract =
      await this.contractService.listContractIcloud(options);

    const listPawnContract =
      await this.contractService.listContractPawn(options);

    const pawn = this.calculateHomePreviewContractResponse(listPawnContract);
    const icloud =
      this.calculateHomePreviewContractResponse(listIcloudContract);

    return {
      pawn,
      icloud,
    };
  }

  async homePreview(me: User): Promise<HomePreview> {
    const user = filterRole(me);

    const contractResponses = await this.getHomePreviewContractResponse(user);

    const cashes = await this.cashRepository.find({
      where: {
        batHo: {
          user,
        },
        deleted_at: IsNull(),
      },
      relations: ['group'],
    });

    const initCashes = await this.cashRepository.find({
      where: [
        {
          filterType: CashFilterType.INIT,
        },
        {
          groupId: GroupCashId.INIT,
        },
      ],
    });

    const batHos = await this.batHoRepository.find({
      where: {
        user,
        deleted_at: IsNull(),
      },
      relations: ['paymentHistories'],
    });

    const users = await this.userRepository.find({
      where: {
        deleted_at: IsNull(),
      },
      relations: ['roles'],
    });

    const customers = await this.customerRepository.find({
      where: { batHos: { user }, deleted_at: IsNull() },
    });

    const fundTotal = initCashes.reduce((total, cash) => {
      return total + cash.amount;
    }, 0);

    const deductionMoneyTotal = cashes.reduce((total, cash) => {
      if (cash.isDeductionMoney) {
        return total + cash.amount;
      }
      return total;
    }, 0);

    const partnerMoneyTotal = cashes.reduce((total, cash) => {
      if (cash.groupId === GroupCashId.PARTNER && !cash.isContract) {
        return total + cash.amount;
      }
      return total;
    }, 0);

    const serviceFeeTotal = cashes.reduce((total, cash) => {
      if (cash.groupId === GroupCashId.SERVICE_FEE && !cash.isContract) {
        return total + cash.amount;
      }
      return total;
    }, 0);

    const paymentOrtherTotal = cashes.reduce((total, cash) => {
      if (
        cash.type === CashType.PAYMENT &&
        !cash.isContract &&
        cash.group.status === GroupCashStatus.ACTIVE
      ) {
        return total + cash.amount;
      }
      return total;
    }, 0);

    const paymentContractTotal =
      contractResponses.icloud.paymentContractTotal +
      contractResponses.pawn.paymentContractTotal;

    const paymentOffSiteTotal = paymentOrtherTotal;

    const badDebitMoneyTotal =
      contractResponses.icloud.badDebitMoneyTotal +
      contractResponses.pawn.badDebitMoneyTotal;

    const surplusMoney = fundTotal - paymentContractTotal - paymentOffSiteTotal;

    const expectedRevenue =
      contractResponses.icloud.expectedRevenue +
      contractResponses.pawn.expectedRevenue;

    const receiptContract =
      contractResponses.icloud.receiptContract +
      contractResponses.pawn.receiptContract -
      deductionMoneyTotal;

    const receiptContractWithDeductionMoney =
      contractResponses.icloud.receiptContract +
      contractResponses.pawn.receiptContract;

    const contractInDebitTotal = batHos.filter(
      (batHo) => batHo.debitStatus == DebitStatus.IN_DEBIT,
    ).length;

    const contractBadDebitTotal = batHos.filter(
      (batHo) => batHo.debitStatus == DebitStatus.BAD_DEBIT,
    ).length;

    const contractCompleteTotal = batHos.filter(
      (batHo) => batHo.debitStatus == DebitStatus.COMPLETED,
    ).length;

    const employeeTotal =
      users.filter(
        (user) => user.roles[0].id == RoleId.USER && user.managerId == me.id,
      ).length ?? 0;

    const storeTotal =
      users.filter((user) => user.roles[0].id == RoleId.ADMIN).length ?? 0;

    const moneyContractMustReceipt = expectedRevenue - receiptContract;
    const moneyContractMustReceiptWithDeductionMoney =
      expectedRevenue - receiptContractWithDeductionMoney;

    return {
      fundTotal,
      surplusMoney,
      expectedRevenue,
      receiptContract,
      badDebitMoneyTotal,
      paymentOffSiteTotal,
      paymentOrtherTotal,
      serviceFeeTotal,
      deductionMoneyTotal,
      partnerMoneyTotal,
      paymentContractTotal,
      contractTotal: batHos.length,
      contractBadDebitTotal,
      contractCompleteTotal,
      contractInDebitTotal,
      employeeTotal,
      storeTotal,
      customerTotal: customers.length,
      contractResponses,
      receiptContractWithDeductionMoney,
      moneyContractMustReceipt,
      moneyContractMustReceiptWithDeductionMoney,
    };
  }

  async statisticsOverview(me: User): Promise<StatisticsOverview[]> {
    const user = filterRole(me);

    const { icloud: icloudContract, pawn: pawnContract } =
      await this.getHomePreviewContractResponse(user);

    const statisticsOverviews: StatisticsOverview[] = [];

    const keys = Object.values(StatisticsContractFilter);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (key === StatisticsContractFilter.TOTAL_DISBURSEMENT) {
        const total =
          icloudContract.paymentContractTotal +
          pawnContract.paymentContractTotal;
        statisticsOverviews.push({
          label: 'Tổng giải ngân',
          total,
          details: [
            {
              contractName: 'Icloud',
              total: icloudContract.paymentContractTotal,
              percent: calculatePercent(
                icloudContract.paymentContractTotal,
                total,
              ),
            },
            {
              contractName: 'Cầm đồ',
              total: pawnContract.paymentContractTotal,
              percent: calculatePercent(
                pawnContract.paymentContractTotal,
                total,
              ),
            },
          ],
        });
      } else if (key === StatisticsContractFilter.TOTAL_MUST_RECEIPT) {
        const total =
          icloudContract.expectedRevenue + pawnContract.expectedRevenue;
        statisticsOverviews.push({
          label: 'Tổng phải thu',
          total,
          details: [
            {
              contractName: 'Icloud',
              total: icloudContract.expectedRevenue,
              percent: calculatePercent(icloudContract.expectedRevenue, total),
            },
            {
              contractName: 'Cầm đồ',
              total: pawnContract.expectedRevenue,
              percent: calculatePercent(pawnContract.expectedRevenue, total),
            },
          ],
        });
      } else if (key === StatisticsContractFilter.TOTAL_RECEIPT) {
        const total =
          icloudContract.receiptContract + pawnContract.receiptContract;
        statisticsOverviews.push({
          label: 'Tổng đã thu',
          total,
          details: [
            {
              contractName: 'Icloud',
              total: icloudContract.receiptContract,
              percent: calculatePercent(icloudContract.receiptContract, total),
            },
            {
              contractName: 'Cầm đồ',
              total: pawnContract.receiptContract,
              percent: calculatePercent(pawnContract.receiptContract, total),
            },
          ],
        });
      } else if (key === StatisticsContractFilter.TOTAL_DEDUCTION) {
        const total =
          icloudContract.deductionMoneyTotal + pawnContract.deductionMoneyTotal;
        statisticsOverviews.push({
          label: 'Tổng cắt trước',
          total,
          details: [
            {
              contractName: 'Icloud',
              total: icloudContract.deductionMoneyTotal,
              percent: calculatePercent(
                icloudContract.deductionMoneyTotal,
                total,
              ),
            },
            {
              contractName: 'Cầm đồ',
              total: pawnContract.deductionMoneyTotal,
              percent: calculatePercent(
                pawnContract.deductionMoneyTotal,
                total,
              ),
            },
          ],
        });
      } else if (key === StatisticsContractFilter.TOTAL_BAD_DEBIT) {
        const total =
          icloudContract.badDebitMoneyTotal + pawnContract.badDebitMoneyTotal;
        statisticsOverviews.push({
          label: 'Tổng nợ xấu',
          total,
          details: [
            {
              contractName: 'Icloud',
              total: icloudContract.badDebitMoneyTotal,
              percent: calculatePercent(
                icloudContract.badDebitMoneyTotal,
                total,
              ),
            },
            {
              contractName: 'Cầm đồ',
              total: pawnContract.badDebitMoneyTotal,
              percent: calculatePercent(pawnContract.badDebitMoneyTotal, total),
            },
          ],
        });
      }
    }

    return statisticsOverviews;
  }

  async getChartProfitDetails({
    year,
    month,
    user,
  }: {
    year: number;
    month?: number;
    user?: any;
  }): Promise<ProfitChartDetail> {
    const chartDetails: ProfitChartDetailItem[] = [];

    const { paymentHistoryRepository, cashRepository } =
      this.databaseService.getRepositories();

    if (!month) {
      for (let i = 1; i <= 12; i++) {
        const timestamp = calculateRangeTime({ year, month: i }, 'month');

        const paymentHistories = await paymentHistoryRepository.find({
          where: {
            paymentStatus: PaymentStatusHistory.FINISH,
            updated_at: Between(timestamp.fromDate, timestamp.toDate),
            user,
          },
        });

        const cashDate = calculateRangeDate({ year, month }, 'month');

        const cashes = await cashRepository.find({
          where: {
            createAt: Between(cashDate.fromDate, cashDate.toDate),
            user,
            isContract: false,
          },
          relations: ['group'],
        });

        const detail = calculateProfit(paymentHistories, cashes);

        chartDetails.push({
          date: i,
          type: 'month',
          detail,
        });
      }
    } else {
      const dayOfMonth = getTotalDayInMonth(month, year);

      for (let i = 1; i <= dayOfMonth; i++) {
        const timestamp = calculateRangeTime({ year, month, day: i }, 'day');

        const paymentHistories = await paymentHistoryRepository.find({
          where: {
            paymentStatus: PaymentStatusHistory.FINISH,
            updated_at: Between(timestamp.fromDate, timestamp.toDate),
            user,
          },
        });

        const cashDate = calculateRangeDate({ year, month }, 'month');

        const cashes = await cashRepository.find({
          where: {
            createAt: Between(cashDate.fromDate, cashDate.toDate),
            user,
          },
          relations: ['group'],
        });

        const detail = calculateProfit(paymentHistories, cashes);

        chartDetails.push({
          date: `${convertPrefixTime(i)}/${month}/${year}`,
          type: 'date',
          detail,
        });
      }
    }

    const minInterest = chartDetails.reduce((min, chart) => {
      if (chart.detail.interest < min) {
        return chart.detail.interest;
      }
      return min;
    }, chartDetails[0].detail.interest);

    const maxInterest = chartDetails.reduce((max, chart) => {
      if (chart.detail.interest > max) {
        return chart.detail.interest;
      }
      return max;
    }, chartDetails[0].detail.interest);

    return {
      items: [...chartDetails],
      minInterest,
      maxInterest,
    };
  }

  async statisticsProfit({
    year,
    month,
    me,
  }: {
    year: number;
    month?: number;
    me: User;
  }): Promise<ProfitStatistics> {
    const user = filterRole(me);

    const { paymentHistoryRepository, cashRepository } =
      this.databaseService.getRepositories();

    let timestamp = calculateRangeTime({ year }, 'year');

    if (month) {
      timestamp = calculateRangeTime({ year, month }, 'month');
    }

    const paymentHistories = await paymentHistoryRepository.find({
      where: {
        paymentStatus: PaymentStatusHistory.FINISH,
        updated_at: Between(timestamp.fromDate, timestamp.toDate),
        user,
      },
    });

    const cashDate = calculateRangeDate({ year, month }, 'month');

    const cashes = await cashRepository.find({
      where: {
        createAt: Between(cashDate.fromDate, cashDate.toDate),
        user,
      },
      relations: ['group'],
    });

    const overview = calculateProfit(paymentHistories, cashes);

    const chartDetail = await this.getChartProfitDetails({
      year,
      month,
      user,
    });

    return { overview, chartDetail };
  }

  async statisticsExpectedReceipt(query: StatisticsContractQueryDto, me: User) {
    let customer = undefined;
    let endDate = undefined;
    let startDate = undefined;

    const user = filterRole(me);

    const { paymentHistoryRepository } = this.databaseService.getRepositories();

    const { month, year, search, day } = query;

    if (search && search.length > 0) {
      customer = {
        personalID: search,
      };
    }

    if (day) {
      const { fromDate, toDate } = calculateRangeDate(
        { day, month, year },
        'day',
      );
      startDate = Between(fromDate, toDate);
      endDate = Between(fromDate, toDate);
    } else if (month) {
      const { fromDate, toDate } = calculateRangeDate(
        { day, month, year },
        'month',
      );
      startDate = Between(fromDate, toDate);
      endDate = Between(fromDate, toDate);
    } else {
      const { fromDate, toDate } = calculateRangeDate(
        { day, month, year },
        'year',
      );
      startDate = Between(fromDate, toDate);
      endDate = Between(fromDate, toDate);
    }

    const paymentHistoriesOfIcloud = await paymentHistoryRepository.find({
      where: {
        user,
        batHo: {
          customer,
        },
        startDate,
        contractType: ContractType.BAT_HO,
      },
    });

    const paymentHistoriesOfPawn = await paymentHistoryRepository.find({
      where: {
        user,
        pawn: {
          customer,
        },
        endDate,
        contractType: ContractType.CAM_DO,
      },
    });

    const rootMoneyIcloud = paymentHistoriesOfIcloud.reduce(
      (total, paymentHistory) => {
        if (paymentHistory.isRootMoney) {
          return total + paymentHistory.payNeed;
        }
        return total;
      },
      0,
    );

    const interestMoneyIcloud = paymentHistoriesOfIcloud.reduce(
      (total, paymentHistory) => {
        if (!paymentHistory.isDeductionMoney && !paymentHistory.isRootMoney) {
          return total + paymentHistory.payNeed;
        }
        return total;
      },
      0,
    );

    const rootMoneyPawn = paymentHistoriesOfPawn.reduce(
      (total, paymentHistory) => {
        if (paymentHistory.isRootMoney) {
          return total + paymentHistory.payNeed;
        }
        return total;
      },
      0,
    );

    const interestMoneyPawn = paymentHistoriesOfPawn.reduce(
      (total, paymentHistory) => {
        if (!paymentHistory.isDeductionMoney && !paymentHistory.isRootMoney) {
          return total + paymentHistory.payNeed;
        }
        return total;
      },
      0,
    );

    return {
      rootMoney: rootMoneyPawn + rootMoneyIcloud,
      interestMoney: interestMoneyPawn + interestMoneyIcloud,
      total:
        rootMoneyPawn +
        rootMoneyIcloud +
        interestMoneyPawn +
        interestMoneyIcloud,
      details: [
        {
          label: 'Icloud',
          key: 'icloud',
          expectedRevenues: [
            {
              label: 'Tổng thu gốc dự kiến',
              value: rootMoneyIcloud,
              key: 'icloud_root_money',
            },
            {
              label: 'Tổng thu lãi dự kiến',
              value: interestMoneyIcloud,
              key: 'icloud_interest_money',
            },
          ],
        },
        {
          label: 'Cầm đồ',
          key: 'pawn',
          expectedRevenues: [
            {
              label: 'Tổng thu gốc dự kiến',
              value: rootMoneyPawn,
              key: 'pawn_root_money',
            },
            {
              label: 'Tổng thu lãi dự kiến',
              value: interestMoneyPawn,
              key: 'pawn_interest_money',
            },
          ],
        },
      ],
    };
  }

  async statisticNewHomePreview(me: User): Promise<StatisticNewHomePreview> {
    const user = filterRole(me);

    const { transactionHistoryRepository, cashRepository } =
      this.databaseService.getRepositories();

    const today = new Date();

    const { fromDate, toDate } = calculateRangeTime(
      {
        day: today.getDate(),
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      },
      'day',
    );

    const transactionHistoriesToday = await transactionHistoryRepository.find({
      where: { created_at: Between(fromDate, toDate), user },
    });

    const rangeDateToday = calculateRangeDate(
      {
        day: today.getDate(),
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      },
      'day',
    );

    const summarizeToday =
      await this.contractService.summarizeContractRangeTime(
        rangeDateToday.fromDate,
        rangeDateToday.toDate,
        user,
      );

    const transactionsToday = transactionHistoriesToday.length;

    const loanToday = transactionHistoriesToday.reduce(
      (loan, transactionHistory) => {
        if (
          transactionHistory.type ===
          TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT
        ) {
          loan.amount += transactionHistory.moneySub;
          loan.contracts += 1;
        }
        return loan;
      },
      {
        contracts: 0,
        amount: 0,
      },
    );

    const loanReceiptToday = transactionHistoriesToday.reduce(
      (loan, transactionHistory) => {
        if (transactionHistory.type === TransactionHistoryType.PAYMENT) {
          loan.amount += transactionHistory.moneySub;
          loan.contracts += 1;
        }
        return loan;
      },
      {
        contracts: 0,
        amount: 0,
      },
    );

    const expectedReceiptToday = {
      contracts: summarizeToday.allContract.total,
      amount:
        summarizeToday.allContract.summarizeDetail.expected.interestMoney +
        summarizeToday.allContract.summarizeDetail.expected.rootMoney,
    };

    const cashes = await cashRepository.find({
      where: {
        user,
        deleted_at: IsNull(),
      },
      relations: ['group'],
    });

    const { allContract, details } =
      await this.contractService.summarizeContractAmounts({
        where: { user },
      });

    const fundTotal = cashes.reduce((total, cash) => {
      if (cash.groupId === GroupCashId.INIT) {
        total += cash.amount;
      }
      return total;
    }, 0);

    const paymentOtherTotal = cashes.reduce((total, cash) => {
      if (cash.type === CashType.PAYMENT && !cash.isContract) {
        return total + cash.amount;
      }
      return total;
    }, 0);

    const overview: OverViewHomeToday = {
      date: formatDate(today),
      transactionsToday,
      loanToday,
      remainingFunds:
        fundTotal -
        allContract.summarizeDetail.loan.disbursementMoney -
        paymentOtherTotal,
      loanReceiptToday,
      expectedReceiptToday,
    };

    const rangeDateMonth = calculateRangeDate(
      { month: today.getMonth() + 1, year: today.getFullYear() },
      'month',
    );

    const summarizeMonth =
      await this.contractService.summarizeContractRangeTime(
        rangeDateMonth.fromDate,
        rangeDateMonth.toDate,
        user,
      );

    const tableDetails: Array<{
      key: string;
      label: string;
      contracts: number;
      loanAmount: {
        amount: number;
        percent: number;
      };
      interestReceipt: {
        amount: number;
        percent: number;
      };
      interestMonth: number;
    }> = [];

    for (let i = 0; i < details.length; i++) {
      const contractDetail = details[i];
      tableDetails.push({
        key: contractDetail.contractType,
        label: contractDetail.label,
        contracts: contractDetail.total,
        loanAmount: {
          amount: contractDetail.summarizeDetail.loan.disbursementMoney,
          percent: calculatePercent(
            contractDetail.summarizeDetail.loan.disbursementMoney,
            allContract.summarizeDetail.loan.disbursementMoney,
          ),
        },
        interestReceipt: {
          amount: contractDetail.summarizeDetail.receipt.interestMoney,
          percent: calculatePercent(
            contractDetail.summarizeDetail.receipt.interestMoney,
            allContract.summarizeDetail.receipt.interestMoney,
          ),
        },
        interestMonth:
          summarizeMonth.details.find(
            (detail) => detail.contractType === contractDetail.contractType,
          )?.summarizeDetail?.receipt?.interestMoney ?? 0,
      });
    }

    const tableStatistics: TableStatisticsNewHomePreview = {
      total: {
        contracts: allContract.summarizeDetail.contractInDebit.contracts,
        loanAmount: allContract.summarizeDetail.contractInDebit.amount,
        interestReceipt: allContract.summarizeDetail.receipt.interestMoney,
        interestMonth:
          summarizeMonth.allContract.summarizeDetail.receipt.interestMoney,
      },
      details: tableDetails,
    };

    const expectedInterest = [
      {
        key: 'reciepted',
        label: 'Đã thu',
        amount: allContract.summarizeDetail.receipt.interestMoney,
        percent: calculatePercent(
          allContract.summarizeDetail.receipt.interestMoney,
          allContract.summarizeDetail.expected.interestMoney,
        ),
      },
      {
        key: 'notReceipt',
        label: 'Chưa thu',
        amount:
          allContract.summarizeDetail.expected.interestMoney -
          allContract.summarizeDetail.receipt.interestMoney,
        percent: calculatePercent(
          allContract.summarizeDetail.expected.interestMoney -
            allContract.summarizeDetail.receipt.interestMoney,
          allContract.summarizeDetail.expected.interestMoney,
        ),
      },
    ];

    const profitRate: Array<{
      key: string;
      label: string;
      amount: number;
      percent: number;
    }> = [];

    for (let i = 0; i < details.length; i++) {
      const detailContract = details[i];
      profitRate.push({
        key: detailContract.contractType,
        label: detailContract.label,
        amount: detailContract.summarizeDetail.expected.interestMoney,
        percent: calculatePercent(
          detailContract.summarizeDetail.expected.interestMoney,
          allContract.summarizeDetail.expected.interestMoney,
        ),
      });
    }

    const pieChartStatistics: PieChartStatisticsNewHomePreview = {
      expectedInterest,
      profitRate,
    };

    return {
      overview,
      contractAwaitingApproval: 0,
      tableStatistics,
      pieChartStatistics,
    };
  }
}
