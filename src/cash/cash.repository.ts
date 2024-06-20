import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { ContractInitLabel } from 'src/common/constant/contract';
import { ContractType, SummarizeOptions } from 'src/common/types';
import { calculateReduceTotal } from 'src/common/utils/calculate';
import { generatePrefixNumberId } from 'src/common/utils/generated-id';
import { getFullName } from 'src/common/utils/get-full-name';
import {
  calculateRangeDate,
  convertPostgresDate,
  formatDate,
} from 'src/common/utils/time';
import { Customer } from 'src/customer/customer.entity';
import { InitGroupCashContractData } from 'src/group-cash/group-cash.data';
import { Pawn } from 'src/pawn/pawn.entity';
import { User } from 'src/user/user.entity';
import {
  Between,
  DataSource,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { Cash } from './cash.entity';
import {
  CashFilterType,
  CashType,
  ContractCash,
  ISummarizeCashContract,
  ISummarizeCashContractDetail,
  ISummarizeCashOutSite,
  SummarizeGroupCashDetail,
} from './cash.type';
import { CashResponseDto } from './dto/cash-response.dto';
import { CreateCashDto } from './dto/create-cash.dto';
import { UpdateCashDto } from './dto/update-cash.dto';

export const CASH_CODE_PREFIX = 'c';

const noteContract = (filter: string, contractId: string) => {
  switch (filter) {
    case CashFilterType.PAYMENT_CONTRACT:
      return `Chi tiền đưa khách hợp đồng ${contractId}`;
    case CashFilterType.RECEIPT_CONTRACT:
      return `Thu tiền đóng hợp đồng ${contractId}`;
    case CashFilterType.DEDUCTION:
      return `Thu tiền cắt hợp đồng ${contractId}`;
    case CashFilterType.LOAN_MORE_CONTRACT:
      return `Chi tiền vay thêm hợp đồng ${contractId}`;
    case CashFilterType.DOWN_ROOT_MONEY:
      return `Thu bớt gốc hợp đồng ${contractId}`;
    default:
      return `Tiền hợp đồng ${contractId}`;
  }
};

const createCashContractPayload = (
  user: User,
  customer: Customer,
  filterCash: string,
  contract: ContractCash,
) => {
  let defaultPayload: CreateCashDto = {
    staff: user?.fullName ?? user?.username,
    traders: getFullName(customer.firstName, customer.lastName) ?? '',
    isContract: true,
    userId: user.id,
    type: CashType.PAYMENT,
    amount: contract.amount,
    createAt: convertPostgresDate(contract.date),
    contractId: contract.contractId,
  };

  if (contract.contractType === ContractType.BAT_HO) {
    defaultPayload = { ...defaultPayload, batHoId: contract.id };
  } else if (contract.contractType === ContractType.CAM_DO) {
    defaultPayload = { ...defaultPayload, pawnId: contract.id };
  }

  switch (filterCash) {
    case CashFilterType.PAYMENT_CONTRACT:
      return {
        ...defaultPayload,
        type: CashType.PAYMENT,
        note: noteContract(filterCash, contract.contractId),
        filterType: CashFilterType.PAYMENT_CONTRACT,
        groupId: InitGroupCashContractData.find(
          (groupCash) =>
            groupCash.filterType === CashFilterType.PAYMENT_CONTRACT,
        )?.id,
      };
    case CashFilterType.RECEIPT_CONTRACT:
      return {
        ...defaultPayload,
        type: CashType.RECEIPT,
        note: noteContract(filterCash, contract.contractId),
        filterType: CashFilterType.RECEIPT_CONTRACT,
        groupId: InitGroupCashContractData.find(
          (groupCash) =>
            groupCash.filterType === CashFilterType.RECEIPT_CONTRACT,
        )?.id,
      };
    case CashFilterType.LOAN_MORE_CONTRACT:
      return {
        ...defaultPayload,
        type: CashType.PAYMENT,
        note: noteContract(filterCash, contract.contractId),
        filterType: CashFilterType.LOAN_MORE_CONTRACT,
        groupId: InitGroupCashContractData.find(
          (groupCash) =>
            groupCash.filterType === CashFilterType.LOAN_MORE_CONTRACT,
        )?.id,
      };
    case CashFilterType.DOWN_ROOT_MONEY:
      return {
        ...defaultPayload,
        type: CashType.RECEIPT,
        note: noteContract(filterCash, contract.contractId),
        filterType: CashFilterType.DOWN_ROOT_MONEY,
        groupId: InitGroupCashContractData.find(
          (groupCash) =>
            groupCash.filterType === CashFilterType.DOWN_ROOT_MONEY,
        )?.id,
      };
    case CashFilterType.DEDUCTION:
      return {
        ...defaultPayload,
        type: CashType.RECEIPT,
        isDeductionMoney: true,
        note: noteContract(filterCash, contract.contractId),
        filterType: CashFilterType.DEDUCTION,
        groupId: InitGroupCashContractData.find(
          (groupCash) => groupCash.filterType === CashFilterType.DEDUCTION,
        )?.id,
      };
    case CashFilterType.SERVICE_FEE:
      return {
        ...defaultPayload,
        type: CashType.PAYMENT,
        isServiceFee: true,
        note: noteContract(filterCash, contract.contractId),
        filterType: CashFilterType.SERVICE_FEE,
      };
    case CashFilterType.PARTNER:
      return {
        ...defaultPayload,
        type: CashType.PAYMENT,
        isPartner: true,
        note: noteContract(filterCash, contract.contractId),
        filterType: CashFilterType.PARTNER,
      };
    default:
      return defaultPayload;
  }
};

export interface CashRepository extends Repository<Cash> {
  this: CashRepository;

  checkCashExist(
    options: FindOneOptions<Cash>,
    throwError?: { message?: string },
    exist?: boolean,
  ): Promise<Cash>;

  createCash(payload: CreateCashDto): Promise<Cash>;

  createCashContract(
    contract: { pawn?: Pawn; icloud?: BatHo },
    filterCash: string,
    data: { amount: number },
  ): Promise<Cash>;

  updateCash(payload: UpdateCashDto & { id: string }): Promise<Cash>;

  calculateTotal(options): Promise<{
    totalPayment: number;
    totalReceipt: number;
    totalRootMoney: number;
    totalInterestMoney: number;
  }>;

  mapCashResponse(cash: Cash | null): CashResponseDto | null;

  summarizeCashContract(
    options: SummarizeOptions,
  ): Promise<ISummarizeCashContract>;

  summarizeCashOutSite(
    options: SummarizeOptions,
  ): Promise<ISummarizeCashOutSite>;
}

export const CashRepositoryProvider = {
  provide: getRepositoryToken(Cash),
  inject: [getDataSourceToken()],
  useFactory(dataSource: DataSource) {
    return dataSource.getRepository(Cash).extend(CashCustomRepository);
  },
};

export const CashCustomRepository: Pick<CashRepository, any> = {
  async checkCashExist(
    this: CashRepository,
    options: FindOneOptions<Cash>,
    throwError?: { message?: string },
    exist?: boolean,
  ) {
    const Cash = await this.findOne(options);

    if (throwError) {
      if (exist && Cash) {
        throw new Error(throwError.message ?? 'Cash exist');
      } else if (!exist && !Cash) {
        throw new Error(throwError.message ?? 'Cash not found or not exist');
      }
    }

    return Cash;
  },

  async createCash(
    this: CashRepository,
    payload: CreateCashDto,
  ): Promise<Cash> {
    if (!payload.isContract && !payload.groupId) {
      throw new Error('Vui lòng chọn nhóm thu chi cho phiếu');
    }

    const newCash = await this.create({
      ...payload,
      code: generatePrefixNumberId(CASH_CODE_PREFIX),
      createAt: convertPostgresDate(payload.createAt as any),
    });

    return await this.save(newCash);
  },

  async createCashContract(
    this: CashRepository,
    contract: {
      pawn?: Pawn;
      icloud?: BatHo;
    },
    filterCash: string,
    data: { amount: number },
  ): Promise<Cash> {
    const { pawn, icloud } = contract;

    if (!pawn && !icloud) {
      throw new Error('Hợp đồng không tồn tại để tạo thu chi');
    }

    const user = pawn?.user ?? icloud?.user;
    const customer = pawn?.customer ?? icloud?.customer;

    const contractCash: ContractCash = {
      contractType: pawn ? ContractType.CAM_DO : ContractType.BAT_HO,
      id: pawn?.id ?? icloud?.id,
      date: pawn?.loanDate
        ? formatDate(pawn?.loanDate)
        : formatDate(icloud?.loanDate),
      amount: data.amount,
      contractId: pawn?.contractId ?? icloud?.contractId,
    };

    const payload = createCashContractPayload(
      user,
      customer,
      filterCash,
      contractCash,
    );

    return this.createCash(payload);
  },

  async updateCash(
    this: CashRepository,
    payload: UpdateCashDto & { id: string },
  ): Promise<Cash> {
    const { id } = payload;

    const cash = await this.checkCashExist({ where: { id } }, {});

    const keysPayload = Object.keys(payload);

    for (let i = 0; i < keysPayload.length; i++) {
      const key = keysPayload[i];

      const payloadValue = payload[key];

      const CashValue = cash[key];

      if (CashValue !== undefined && CashValue !== payloadValue) {
        cash[key] = payloadValue;
      }
    }

    cash.updated_at = new Date();

    await this.save({
      ...Cash,
      createAt: payload.createAt
        ? convertPostgresDate(payload.createAt)
        : cash.createAt,
    });

    return cash;
  },

  mapCashResponse(cash: Cash | null): CashResponseDto | null {
    if (cash) {
      let admin = '';
      let rootMoney = 0;
      let interestMoney = 0;
      let contractId = '';
      let customer = {};

      if (cash.isContract) {
        if (cash.batHo) {
          cash.traders =
            getFullName(
              cash.batHo?.customer?.firstName,
              cash.batHo?.customer?.lastName,
            ) ?? '';
          cash.staff = cash.batHo?.user?.fullName ?? cash.batHo.user.username;
          admin =
            cash.batHo?.user?.manager?.fullName ??
            cash.batHo?.user?.manager?.username;
          contractId = cash.batHo.contractId;
          rootMoney = cash.batHo.loanAmount;
          interestMoney = cash.batHo.revenueReceived - cash.batHo.loanAmount;
          customer = cash.batHo.customer ?? {};
        } else if (cash.pawn) {
          cash.traders =
            getFullName(
              cash.pawn?.customer?.firstName,
              cash.pawn?.customer?.lastName,
            ) ?? '';
          cash.staff = cash.pawn?.user?.fullName ?? cash.pawn?.user?.username;
          admin =
            cash.pawn?.user?.manager?.fullName ??
            cash.pawn?.user?.manager?.username;
          contractId = cash.pawn.contractId;
          rootMoney = cash.pawn.loanAmount;
          interestMoney = cash.pawn.revenueReceived - cash.pawn.loanAmount;
          customer = cash.pawn.customer ?? {};
        }
      }

      return {
        ...cash,
        createAt: formatDate(cash.createAt),
        admin,
        contractId,
        rootMoney,
        interestMoney,
        customer,
      } as CashResponseDto;
    }

    return null;
  },

  async calculateTotal(
    this: CashRepository,
    options,
  ): Promise<{
    totalPayment: number;
    totalReceipt: number;
    totalRootMoney: number;
    totalInterestMoney: number;
  }> {
    const cashes = await this.find(options);

    const cashesResponse = cashes.map((cash) => this.mapCashResponse(cash));

    const totalPayment = cashesResponse.reduce((total, cash) => {
      if (cash.type === CashType.PAYMENT) {
        total += cash.amount;
      }
      return total;
    }, 0);

    const totalReceipt = cashesResponse.reduce((total, cash) => {
      if (cash.type === CashType.RECEIPT) {
        total += cash.amount;
      }
      return total;
    }, 0);

    const totalRootMoney = cashesResponse.reduce(
      (total, cash) => cash.rootMoney + total,
      0,
    );

    const totalInterestMoney = cashesResponse.reduce(
      (total, cash) => cash.interestMoney + total,
      0,
    );

    return { totalInterestMoney, totalPayment, totalReceipt, totalRootMoney };
  },

  async summarizeCashContract(
    this: CashRepository,
    options: SummarizeOptions,
  ): Promise<ISummarizeCashContract> {
    const { date, type, user } = options;

    const isAllUndefined = Object.values(date).every(
      (value) => value === undefined,
    );

    const { fromDate, toDate } = calculateRangeDate(date, type);

    const where: FindOptionsWhere<Cash> = {
      user,
      createAt: isAllUndefined ? undefined : Between(fromDate, toDate),
      isContract: true,
    };

    const cashes = await this.find({ where, relations: ['group'] });

    const cashesReceipt = cashes.filter(
      (cash) => cash.type === CashType.RECEIPT,
    );

    const cashesPayment = cashes.filter(
      (cash) => cash.type === CashType.PAYMENT,
    );

    const groupCashDetails: SummarizeGroupCashDetail[] = [];

    for (let i = 0; i < cashes.length; i++) {
      const cash = cashes[i];
      const groupCashIndex = groupCashDetails.findIndex(
        (group) => group.key === cash.groupId,
      );

      if (groupCashIndex === -1) {
        groupCashDetails.push({
          key: cash.groupId,
          label: cash.group?.groupName ?? '',
          cashType: cash.type,
          total: cash.amount,
        });
      } else {
        groupCashDetails[groupCashIndex].total += cash.amount;
      }
    }

    const all = {
      receiptTotal: calculateReduceTotal<Pick<Cash, 'amount'>>(
        cashesReceipt,
        'amount',
      ),
      paymentTotal: calculateReduceTotal<Pick<Cash, 'amount'>>(
        cashesPayment,
        'amount',
      ),
      groupCashDetails,
    };

    const details: ISummarizeCashContractDetail[] = [];

    const contractTypes = Object.values(ContractType);

    for (let i = 0; i < contractTypes.length; i++) {
      const type = contractTypes[i];

      const cashesType = cashes.filter((cash) => cash.contractType === type);

      const groupCashDetails: SummarizeGroupCashDetail[] = [];

      for (let i = 0; i < cashesType.length; i++) {
        const cash = cashesType[i];
        const groupCashIndex = groupCashDetails.findIndex(
          (group) => group.key === cash.groupId,
        );

        if (groupCashIndex === -1) {
          groupCashDetails.push({
            key: cash.groupId,
            label: cash.group?.groupName ?? '',
            cashType: cash.type,
            total: cash.amount,
          });
        } else {
          groupCashDetails[groupCashIndex].total += cash.amount;
        }
      }

      details.push({
        key: type,
        label: ContractInitLabel[type],
        receiptTotal: calculateReduceTotal<Pick<Cash, 'amount'>>(
          cashesReceipt.filter((c) => c.contractType === type),
          'amount',
        ),
        paymentTotal: calculateReduceTotal<Pick<Cash, 'amount'>>(
          cashesPayment.filter((c) => c.contractType === type),
          'amount',
        ),
        groupCashDetails,
      });
    }

    return {
      all,
      details,
    };
  },

  async summarizeCashOutSite(
    options: SummarizeOptions,
  ): Promise<ISummarizeCashOutSite> {
    const { date, type, user } = options;

    const isAllUndefined = Object.values(date).every(
      (value) => value === undefined,
    );

    const { fromDate, toDate } = calculateRangeDate(date, type);

    const where: FindOptionsWhere<Cash> = {
      user,
      createAt: isAllUndefined ? undefined : Between(fromDate, toDate),
      isContract: true,
    };

    const cashes = await this.find({ where, relations: ['group'] });

    const cashesReceipt = cashes.filter(
      (cash) => cash.type === CashType.RECEIPT,
    );

    const cashesPayment = cashes.filter(
      (cash) => cash.type === CashType.PAYMENT,
    );

    const groupCashDetails: SummarizeGroupCashDetail[] = [];

    for (let i = 0; i < cashes.length; i++) {
      const cash = cashes[i];
      const groupCashIndex = groupCashDetails.findIndex(
        (group) => group.key === cash.groupId,
      );

      if (groupCashIndex === -1) {
        groupCashDetails.push({
          key: cash.groupId,
          label: cash.group?.groupName ?? '',
          cashType: cash.type,
          total: cash.amount,
        });
      } else {
        groupCashDetails[groupCashIndex].total += cash.amount;
      }
    }

    const receiptTotal = calculateReduceTotal<Pick<Cash, 'amount'>>(
      cashesReceipt,
      'amount',
    );

    const paymentTotal = calculateReduceTotal<Pick<Cash, 'amount'>>(
      cashesPayment,
      'amount',
    );

    return {
      receiptTotal,
      paymentTotal,
      groupCashDetails,
    };
  },
};
