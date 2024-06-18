import { PathImpl2 } from '@nestjs/config';
import { Cash } from 'src/cash/cash.entity';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { ContractInitLabel } from '../constant/contract';
import { ContractType } from '../types';
import { Contract } from '../../contract/contract.type';
import {
  TransactionHistoryType,
} from '../../transaction-history/transaction-history.type';
import { ProfitCash, ProfitData } from '../../statistics/types/profit.type';
import {
  calculateTotalDayRangeDate,
  convertPostgresDate,
  formatDate,
  getTodayNotTimeZone,
} from './time';
import { PaymentHistoryType, PaymentStatusHistory } from 'src/payment-history/payment-history.type';
import { CashType } from 'src/cash/cash.type';
import { GroupCashId } from 'src/group-cash/group-cash.type';

export const isLastPaymentHistoryUnFinish = (
  paymentHistory: PaymentHistory,
) => {
  const today = formatDate(new Date());
  return (
    paymentHistory.paymentStatus !== PaymentStatusHistory.FINISH &&
    formatDate(paymentHistory.startDate) !== today &&
    new Date(paymentHistory.startDate).getTime() <
      new Date(convertPostgresDate(today)).getTime()
  );
};

export const isLastPaymentHistoryPeriodUnFinish = (
  paymentHistory: PaymentHistory,
) => {
  const todayTime = new Date().setHours(0, 0, 0, 0);
  return (
    paymentHistory.paymentStatus !== PaymentStatusHistory.FINISH &&
    todayTime > new Date(paymentHistory.endDate).setHours(0, 0, 0, 0)
  );
};

export const calculateProfit = (
  paymentHistories: PaymentHistory[],
  cashes: Cash[],
): ProfitData => {
  const receiptDetails: ProfitCash[] = [];
  const paymentDetails: ProfitCash[] = [];

  for (let i = 0; i < paymentHistories.length; i++) {
    const paymentHistory = paymentHistories[i];

    const contractType = paymentHistory.contractType;

    const receiptContractIndex = receiptDetails.findIndex(
      (r) => r.key === contractType,
    );

    if (receiptContractIndex === -1) {
      receiptDetails.push({
        label: ContractInitLabel[contractType],
        key: contractType,
        value: paymentHistory.payMoney,
      });
    } else {
      receiptDetails[receiptContractIndex].value =
        receiptDetails[receiptContractIndex].value + paymentHistory.payMoney;
    }
  }

  const receiptCash = cashes.reduce((total, cash) => {
    if (
      cash.type === CashType.RECEIPT &&
      cash.groupId !== GroupCashId.INIT &&
      !cash.isContract
    ) {
      return total + cash.amount;
    }
    return total;
  }, 0);

  receiptDetails.push({
    key: 'receipt_outside',
    label: 'Thu ngoài lề',
    value: receiptCash,
  });

  const cashPayments = cashes.filter((cash) => cash.type === CashType.PAYMENT);

  for (let i = 0; i < cashPayments.length; i++) {
    const cash = cashPayments[i];

    const paymentCashIndex = paymentDetails.findIndex(
      (r) => r.key === (cash.groupId ? cash.groupId : 'giai_ngan'),
    );

    if (paymentCashIndex === -1) {
      paymentDetails.push({
        label: cash?.group?.groupName ?? 'Giải ngân',
        key: cash.groupId ?? 'giai_ngan',
        value: cash.amount,
      });
    } else {
      paymentDetails[paymentCashIndex].value =
        paymentDetails[paymentCashIndex].value + cash.amount;
    }
  }

  const totalReceipt = receiptDetails.reduce((total, receipt) => {
    return total + receipt.value;
  }, 0);

  const totalPayment = paymentDetails.reduce((total, payment) => {
    return total + payment.value;
  }, 0);

  const interestTotal = totalReceipt - totalPayment;

  return {
    receipt: {
      details: receiptDetails,
      total: totalReceipt,
    },
    payment: {
      details: paymentDetails,
      total: totalPayment,
    },
    interest: interestTotal,
  };
};

export const calculatePercent = (partialValue, totalValue) => {
  const percent = parseFloat(((100 * partialValue) / totalValue).toFixed(2));
  return Number.isNaN(percent) ? 0 : percent;
};

interface ConditionCalculateTotal {
  filedCondition: string;
  type: '===' | '>=' | '<=';
  valueCompare: any;
}

export function calculateTotal<T extends Record<string, any>>(
  list: Array<T>,
  condition: ConditionCalculateTotal,
  filedAmount: string,
) {
  let total = 0;
  switch (condition.type) {
    case '===':
      total = list.reduce((sum, item) => {
        if (item[condition.filedCondition] === condition.valueCompare) {
          total += (item[filedAmount] as number) ?? 0;
        }
        return sum;
      }, 0);
      break;
    default:
      total = 0;
  }
  return total;
}

export const calculateSettlementMoney = (payload: {
  settlementDate?: string;
  loanDate: string;
  paymentHistories: PaymentHistory[];
  interestMoneyOneDay: number;
}) => {
  const { settlementDate, loanDate, paymentHistories, interestMoneyOneDay } =
    payload;

  const today = settlementDate
    ? new Date(settlementDate)
    : getTodayNotTimeZone();

  const totalDayToToday = calculateTotalDayRangeDate(
    new Date(new Date(loanDate).setHours(0, 0, 0, 0)),
    today,
  );

  const interestMoneyTotal = totalDayToToday * interestMoneyOneDay;

  const rootPaymentHistory = paymentHistories.find(
    (paymentHistory) => paymentHistory.type === PaymentHistoryType.ROOT_MONEY,
  );

  const moneyPaid = paymentHistories.reduce((total, paymentHistory) => {
    if (
      paymentHistory.paymentStatus === PaymentStatusHistory.FINISH &&
      paymentHistory.type === PaymentHistoryType.INTEREST_MONEY
    ) {
      return total + paymentHistory.payMoney;
    }
    return total;
  }, 0);

  return rootPaymentHistory?.payNeed + interestMoneyTotal - moneyPaid;
};

export const calculateMoneyInDebit = (contract: Contract) => {
  const transactionHistories = contract.transactionHistories ?? [];

  return transactionHistories.reduce((total, transactionHistory) => {
    if (
      transactionHistory.type ===
      TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT
    ) {
      total += transactionHistory.moneySub;
    }

    return total;
  }, 0);
};

export const calculateMoneyBadDebit = (contract: Contract) => {
  const paymentHistories = contract.paymentHistories ?? [];

  return paymentHistories.reduce((total, paymentHistory) => {
    if (
      paymentHistory.paymentStatus === PaymentStatusHistory.UNFINISH ||
      paymentHistory.paymentStatus === null
    ) {
      total += paymentHistory.payNeed;
    }

    return total;
  }, 0);
};

export const calculateMoneyCompleted = (contract: Contract) => {
  const paymentHistories = contract.paymentHistories ?? [];

  let total = 0;

  if (contract.contractType === ContractType.BAT_HO) {
    total = paymentHistories.reduce((total, paymentHistory) => {
      return total + paymentHistory.payNeed;
    }, 0);
  } else if (contract.contractType === ContractType.CAM_DO) {
    total = calculateSettlementMoney({
      settlementDate: contract.settlementDate,
      loanDate: contract.loanDate,
      paymentHistories: contract.paymentHistories ?? [],
      interestMoneyOneDay: contract.summarize.expected.interestMoneyOneDay,
    });
  }

  return total;
};

export const calculateReduceTotal = <T>(
  list: T[],
  field: PathImpl2<T>,
  sum?: number,
) => {
  const total = list.reduce(
    (total, item) => total + item[field as string] ?? 0,
    sum ?? 0,
  );

  return typeof total !== 'number'
    ? 0
    : Number.isNaN(total)
      ? 0
      : (total as number);
};
