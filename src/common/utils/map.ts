import * as moment from 'moment';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
import { formatDate } from './time';

export const mapPaymentHistoryResponse = (
  paymentHistory: PaymentHistory | null,
): any | null => {
  if (paymentHistory) {
    return {
      paymentHistory: {
        ...paymentHistory,
        startDate: moment(new Date(paymentHistory.startDate)).format(
          'DD/MM/YYYY',
        ) as any,
        endDate: moment(new Date(paymentHistory.endDate)).format(
          'DD/MM/YYYY',
        ) as any,
        totalPaymentAmount: paymentHistory.payNeed,
        customerPaymentAmount: paymentHistory.payMoney,
      },
    };
  }
  return null;
};

export const mapTransactionHistoryResponse = (
  transactionHistory: TransactionHistory | null,
): { transactionHistory: any | null } => {
  if (transactionHistory) {
    return {
      transactionHistory: {
        ...transactionHistory,
        employeeName:
          transactionHistory.user?.fullName ??
          transactionHistory.user?.username,
        createAt: formatDate(transactionHistory.createAt, 'DD/MM/YYYY HH:MM'),
      },
    };
  }
  return null;
};

const onlyUnique = (value, index, array) => {
  return array.indexOf(value) === index;
};

export const mapUniqueArray = <T>(arr: T[]) => {
  return arr.filter(onlyUnique);
};
