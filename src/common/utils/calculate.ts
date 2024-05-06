import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { convertPostgresDate, formatDate } from './time';
import { PaymentStatusHistory } from '../interface/history';
import { DebitStatus } from '../interface/bat-ho';

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

export const calculateLateAndBadPaymentIcloud = (
  paymentHistories: PaymentHistory[],
  debitStatus: string,
) => {
  let latePaymentDay = 0;
  let latePaymentMoney = 0;
  let badDebitMoney = 0;
  let isFinishToday = false;

  const today = formatDate(new Date());

  const sortPaymentHistories = paymentHistories.sort(
    (p1, p2) => p1.rowId - p2.rowId,
  );

  const lastPaymentHistoryUnfinish = paymentHistories.find((paymentHistory) =>
    isLastPaymentHistoryUnFinish(paymentHistory),
  );

  if (lastPaymentHistoryUnfinish) {
    latePaymentDay = Math.round(
      (new Date(convertPostgresDate(today)).getTime() -
        new Date(lastPaymentHistoryUnfinish.startDate).getTime()) /
        86400000,
    );

    latePaymentMoney = sortPaymentHistories.reduce((total, paymentHistory) => {
      if (isLastPaymentHistoryUnFinish(paymentHistory)) {
        return paymentHistory.payNeed + total;
      }
      return total;
    }, 0);
  }

  if (debitStatus == DebitStatus.BAD_DEBIT) {
    badDebitMoney = paymentHistories.reduce((total, paymentHistory) => {
      if (paymentHistory.paymentStatus != PaymentStatusHistory.FINISH) {
        return total + paymentHistory.payNeed;
      }
      return total;
    }, 0);
  }

  const paymentHistoryFinishToday = paymentHistories.find(
    (paymentHistory) =>
      paymentHistory.paymentStatus == PaymentStatusHistory.FINISH &&
      formatDate(paymentHistory.startDate) == today,
  );

  if (paymentHistoryFinishToday) {
    isFinishToday = true;
  }

  return { latePaymentDay, latePaymentMoney, badDebitMoney, isFinishToday };
};
