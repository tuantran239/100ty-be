import { User } from 'src/user/user.entity';
import {
  CashFilterType,
  CashType,
  ContractType,
  paymentHistoriesCashItem,
} from '../interface';
import { generatePrefixNumberId } from './generated-id';
import { getFullName } from './get-full-name';
import { Customer } from 'src/customer/customer.entity';
import { CreateCashDto } from 'src/cash/dto/create-cash.dto';
import { CASH_CODE_PREFIX } from 'src/cash/cash.controller';
import { convertPostgresDate, formatDate } from './time';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';

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

export const createCashContractPayload = (
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
    code: generatePrefixNumberId(CASH_CODE_PREFIX),
    type: CashType.PAYMENT,
    amount: contract.amount,
    createAt: convertPostgresDate(contract.date),
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

export const createPaymentHistoriesCash = (
  paymentHistories: PaymentHistory[],
) => {
  const items: paymentHistoriesCashItem[] =
    paymentHistories
      .filter((paymentHistory) => !paymentHistory.isDeductionMoney)
      .map((paymentHistory) => ({
        id: paymentHistory.id,
        payMoney: paymentHistory.payMoney,
        payNeed: paymentHistory.payNeed,
        paymentStatus: paymentHistory.paymentStatus,
        startDate: convertPostgresDate(formatDate(paymentHistory.startDate)),
        endDate: convertPostgresDate(formatDate(paymentHistory.endDate)),
      })) ?? [];

  return { data: items };
};
