import { Injectable } from '@nestjs/common';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { Cash } from 'src/cash/cash.entity';
import { GroupCashId } from 'src/common/constant/group-cash';
import {
  CashFilterType,
  CashType,
  GroupCashStatus,
  RoleId,
  StatisticsContractFilter,
  StatisticsContractItem,
} from 'src/common/interface';
import { DebitStatus } from 'src/common/interface/bat-ho';
import { Contract } from 'src/common/interface/contract';
import { PaymentStatusHistory } from 'src/common/interface/history';
import {
  ProfitChartDetail,
  ProfitChartDetailItem,
  ProfitStatistics,
} from 'src/common/interface/profit';
import { StatisticsContractQuery } from 'src/common/interface/query';
import {
  ContractHomePreviewResponses,
  HomePreview,
  HomePreviewContractResponse,
  ServiceFeeDetail,
  ServiceFeeItemStatistics,
  ServiceFeeStatisticsResponse,
  StatisticsOverview,
} from 'src/common/interface/statistics';
import { calculatePercent, calculateProfit } from 'src/common/utils/calculate';
import { getFullName } from 'src/common/utils/get-full-name';
import {
  calculateRangeDate,
  calculateRangeTime,
  convertPrefixTime,
  getTotalDayInMonth,
} from 'src/common/utils/time';
import { ContractService } from 'src/contract/contract.service';
import { Customer } from 'src/customer/customer.entity';
import { DatabaseService } from 'src/database/database.service';
import { Pawn } from 'src/pawn/pawn.entity';
import { User } from 'src/user/user.entity';
import {
  Between,
  DataSource,
  Equal,
  FindManyOptions,
  IsNull,
  Repository,
} from 'typeorm';
import { StatisticsContractQueryDto } from './dto/statistics-contract-query.dto';
import { filterRole } from 'src/common/utils/filter-role';

@Injectable()
export class StatisticsService {
  private batHoRepository: Repository<BatHo>;
  private pawnRepository: Repository<Pawn>;
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

  private mapUserServiceFee(users: User[], usersNoOption: User[]) {
    const items: ServiceFeeItemStatistics[] = users.map((user) => {
      const fee = user.contractsBatHo.reduce((total, batHo) => {
        return batHo.serviceFee.value + total;
      }, 0);

      const details: ServiceFeeDetail[] = user.contractsBatHo.map((batHo) => ({
        contractId: batHo.contractId,
        customer: getFullName(
          batHo.customer?.firstName,
          batHo.customer?.lastName,
        ),
        employee: user.fullName ?? user.username,
        fee: batHo.serviceFee.value,
      }));

      return {
        userName: user.username,
        totalContract: user.contractsBatHo?.length ?? 0,
        fee,
        details,
      };
    });

    let totalFee = 0;

    for (let i = 0; i < usersNoOption.length; i++) {
      const user = usersNoOption[i];

      const fee = user.contractsBatHo.reduce((total, batHo) => {
        return batHo.serviceFee.value + total;
      }, 0);

      totalFee += fee;
    }

    return {
      totalFee,
      items: items,
      totalPage: usersNoOption.length ?? 0,
    };
  }

  private async mapAdminServiceFee(admins: User[], adminsNoOption: User[]) {
    let totalFee = 0;

    const items: ServiceFeeItemStatistics[] = [];

    for (let i = 0; i < admins.length; i++) {
      const admin = admins[i];

      const users = await this.userRepository.find({
        where: [{ managerId: admin.id }],
        relations: ['contractsBatHo', 'contractsBatHo.customer'],
      });

      let totalContract = 0;

      const fee = users.reduce((total, user) => {
        totalContract += user.contractsBatHo.length;
        const feeUser = user.contractsBatHo.reduce((total, batHo) => {
          return batHo.serviceFee.value + total;
        }, 0);
        return total + feeUser;
      }, 0);

      const details: ServiceFeeDetail[] = users.reduce((feeDetails, user) => {
        const detailsFeeUser: ServiceFeeDetail[] = user.contractsBatHo.map(
          (batHo) => ({
            contractId: batHo.contractId,
            customer: getFullName(
              batHo.customer?.firstName,
              batHo.customer?.lastName,
            ),
            employee: user.fullName ?? user.username,
            fee: batHo.serviceFee.value,
          }),
        );

        return feeDetails.concat(detailsFeeUser);
      }, []);

      items.push({
        totalContract,
        fee,
        details,
        userName: admin.username,
      });
    }

    for (let i = 0; i < adminsNoOption.length; i++) {
      const admin = adminsNoOption[i];

      const users = await this.userRepository.find({
        where: [{ managerId: admin.id }],
        relations: ['contractsBatHo', 'contractsBatHo.customer'],
      });

      const fee = users.reduce((total, user) => {
        const feeUser = user.contractsBatHo.reduce((total, batHo) => {
          return batHo.serviceFee.value + total;
        }, 0);
        return total + feeUser;
      }, 0);

      totalFee += fee;
    }

    return {
      totalFee,
      items,
      totalPage: adminsNoOption.length ?? 0,
    };
  }

  async serviceFee(
    user: User,
    options: FindManyOptions<User>,
    type?: 'user' | 'admin',
  ): Promise<ServiceFeeStatisticsResponse> {
    const role = user.roles[0];

    if (role.id === RoleId.ADMIN) {
      const users = await this.userRepository.find({
        where: [{ managerId: user.id }, { id: user.id }],
        relations: ['contractsBatHo', 'contractsBatHo.customer'],
        ...options,
      });

      const usersNoOption = await this.userRepository.find({
        where: [{ managerId: user.id }],
        relations: ['contractsBatHo'],
      });

      const result = await this.mapUserServiceFee(users, usersNoOption);

      return result;
    }

    if (role.id === RoleId.SUPER_ADMIN && type === 'user') {
      const users = await this.userRepository.find({
        where: [
          {
            roles: {
              id: RoleId.USER,
            },
          },
        ],
        relations: ['roles', 'contractsBatHo', 'contractsBatHo.customer'],
        ...options,
      });

      const usersNoOption = await this.userRepository.find({
        where: [
          {
            roles: {
              id: RoleId.USER,
            },
          },
        ],
        relations: ['roles', 'contractsBatHo', 'contractsBatHo.customer'],
      });

      const result = await this.mapUserServiceFee(users, usersNoOption);

      return result;
    } else if (role.id === RoleId.SUPER_ADMIN) {
      const admins = await this.userRepository.find({
        where: [
          {
            roles: {
              id: RoleId.ADMIN,
            },
          },
        ],
        relations: ['roles'],
        ...options,
      });

      const adminsNoOption = await this.userRepository.find({
        where: [
          {
            roles: {
              id: RoleId.ADMIN,
            },
          },
        ],
        relations: ['roles'],
      });

      const result = await this.mapAdminServiceFee(admins, adminsNoOption);

      return result;
    }

    return {
      totalFee: 0,
      items: [],
      totalPage: 0,
    };
  }

  async listPartnerContract(options: FindManyOptions<BatHo>) {
    const data = await this.batHoRepository.findAndCount(options);

    const totalPage = data[1];
    const batHos = data[0];

    const totalMoney = batHos.reduce((total, batHo) => {
      return total + batHo?.partner?.partnerShareAmount ?? 0;
    }, 0);

    const list_bat_ho = batHos.map((batHo) => {
      return {
        contractId: batHo.contractId,
        partnerName: batHo.partner?.name ?? '',
        partnerShareAmount: batHo.partner?.partnerShareAmount ?? 0,
      };
    });

    return { totalPage, totalMoney, list_bat_ho };
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

  async statisticsContract(me: User, query: StatisticsContractQuery) {
    const { type, page, pageSize } = query;

    const user = filterRole(me);

    let queryWhere = {};
    const relations = ['batHo', 'batHo.customer', 'batHo.user', 'user'];

    switch (type) {
      case StatisticsContractFilter.TOTAL_DISBURSEMENT:
        queryWhere = {
          filterType: Equal(CashFilterType.PAYMENT_CONTRACT),
        };
        break;
      case StatisticsContractFilter.TOTAL_BAD_DEBIT:
        queryWhere = {
          filterType: Equal(CashFilterType.RECEIPT_CONTRACT),
          contractStatus: Equal(DebitStatus.BAD_DEBIT),
          isContract: true,
        };
        break;
      case StatisticsContractFilter.TOTAL_DEDUCTION:
        queryWhere = {
          filterType: Equal(CashFilterType.DEDUCTION),
        };
        break;
      case StatisticsContractFilter.TOTAL_RECEIPT:
        queryWhere = {
          filterType: Equal(CashFilterType.RECEIPT_CONTRACT),
        };
        break;
      case StatisticsContractFilter.TOTAL_MUST_RECEIPT:
        queryWhere = {
          filterType: Equal(CashFilterType.RECEIPT_CONTRACT),
        };
        break;
      default:
        queryWhere = {
          isContract: true,
        };
    }

    const data = await this.cashRepository.findAndCount({
      where: { ...queryWhere, user },
      relations,
      take: pageSize ?? 10,
      skip: ((page ?? 1) - 1) * (pageSize ?? 10),
    });

    const totalCash = await this.cashRepository.find({
      where: { ...queryWhere, user },
      relations,
    });

    const list_contract: StatisticsContractItem[] = [];

    const cashes = data[0];

    for (let i = 0; i < cashes.length; i++) {
      const cash = cashes[i];

      const item: StatisticsContractItem = {
        contractId: '',
        customer: '',
        employee: '',
        amount: 0,
      };

      if (cash.batHo) {
        item.contractId = cash.batHo.contractId;
        item.customer = getFullName(
          cash.batHo?.customer?.firstName,
          cash.batHo?.customer?.lastName,
        );
        item.employee =
          cash.batHo?.user?.fullName ?? cash.batHo?.user?.username;

        if (type == StatisticsContractFilter.TOTAL_BAD_DEBIT) {
          item.amount = cash.batHo.customer?.debtMoney ?? 0;
        } else if (type == StatisticsContractFilter.TOTAL_MUST_RECEIPT) {
          item.amount = cash.batHo.revenueReceived ?? 0;
        } else {
          item.amount = cash.amount;
        }
      }

      list_contract.push(item);
    }

    const totalMoney = totalCash.reduce((total, cash) => {
      if (cash.batHo) {
        if (type == StatisticsContractFilter.TOTAL_BAD_DEBIT) {
          return total + cash.batHo.customer?.debtMoney ?? 0;
        } else if (type == StatisticsContractFilter.TOTAL_MUST_RECEIPT) {
          return total + cash.batHo.revenueReceived ?? 0;
        }
      }
      return total + cash.amount;
    }, 0);

    return {
      totalMoney,
      totalPage: totalCash.length,
      list_contract,
    };
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
      },
    });

    const paymentHistoriesOfPawn = await paymentHistoryRepository.find({
      where: {
        user,
        pawn: {
          customer,
        },
        endDate,
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
        if (!paymentHistory.isDeductionMoney || !paymentHistory.isRootMoney) {
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
        if (!paymentHistory.isDeductionMoney || !paymentHistory.isRootMoney) {
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
}
