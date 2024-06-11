import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { CashFilterType, CashType, ContractType } from 'src/common/interface';
import { generatePrefixNumberId } from 'src/common/utils/generated-id';
import { getFullName } from 'src/common/utils/get-full-name';
import { convertPostgresDate, formatDate } from 'src/common/utils/time';
import { Customer } from 'src/customer/customer.entity';
import { User } from 'src/user/user.entity';
import { DataSource, FindOneOptions, Repository } from 'typeorm';
import { Cash } from './cash.entity';
import { CreateCashDto } from './dto/create-cash.dto';
import { UpdateCashDto } from './dto/update-cash.dto';
import { Pawn } from 'src/pawn/pawn.entity';
import { BatHo } from 'src/bat-ho/bat-ho.entity';

export const CASH_CODE_PREFIX = 'c';

const noteContract = (filter: string, contractId: string) => {
  switch (filter) {
    case CashFilterType.PAYMENT_CONTRACT:
      return `Chi tiền đưa khách hợp đồng ${contractId}`;
    case CashFilterType.RECEIPT_CONTRACT:
      return `Thu tiền đóng hợp đồng ${contractId}`;
    case CashFilterType.DEDUCTION:
      return `Thu tiền cắt hợp đồng ${contractId}`;
    case CashFilterType.SERVICE_FEE:
      return `Chi tiền phí làm hợp đồng ${contractId}`;
    case CashFilterType.PARTNER:
      return `Chi tiền cho cộng tác viên hợp đồng ${contractId}`;
    case CashFilterType.LOAN_MORE_CONTRACT:
      return `Chi tiền vay thêm hợp đồng ${contractId}`;
    case CashFilterType.LOAN_MORE_CONTRACT:
      return `Chi tiền vay thêm hợp đồng ${contractId}`;
    case CashFilterType.DOWN_ROOT_MONEY:
      return `Thu bớt gốc hợp đồng ${contractId}`;
    default:
      return `Tiền hợp đồng ${contractId}`;
  }
};

interface ContractCash {
  contractType: string;
  id: string;
  date: string;
  amount: number;
  contractId: string;
}

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
      };
    case CashFilterType.RECEIPT_CONTRACT:
      return {
        ...defaultPayload,
        type: CashType.RECEIPT,
        note: noteContract(filterCash, contract.contractId),
        filterType: CashFilterType.RECEIPT_CONTRACT,
      };
    case CashFilterType.LOAN_MORE_CONTRACT:
      return {
        ...defaultPayload,
        type: CashType.PAYMENT,
        note: noteContract(filterCash, contract.contractId),
        filterType: CashFilterType.LOAN_MORE_CONTRACT,
      };
    case CashFilterType.DOWN_ROOT_MONEY:
      return {
        ...defaultPayload,
        type: CashType.RECEIPT,
        note: noteContract(filterCash, contract.contractId),
        filterType: CashFilterType.DOWN_ROOT_MONEY,
      };
    case CashFilterType.DEDUCTION:
      return {
        ...defaultPayload,
        type: CashType.RECEIPT,
        isDeductionMoney: true,
        note: noteContract(filterCash, contract.contractId),
        filterType: CashFilterType.DEDUCTION,
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
};
