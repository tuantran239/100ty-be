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

export const isLastPaymentHistoryPeriodUnFinish = (
  paymentHistory: PaymentHistory,
) => {
  const todayTime = new Date().setHours(0, 0, 0, 0);
  return (
    paymentHistory.paymentStatus !== PaymentStatusHistory.FINISH &&
    todayTime > new Date(paymentHistory.startDate).setHours(0, 0, 0, 0)
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

  const lastPaymentHistoryUnfinish = sortPaymentHistories.find(
    (paymentHistory) => isLastPaymentHistoryUnFinish(paymentHistory),
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

  const paymentHistoryFinishToday = sortPaymentHistories.find(
    (paymentHistory) =>
      paymentHistory.paymentStatus == PaymentStatusHistory.FINISH &&
      formatDate(paymentHistory.startDate) == today,
  );

  if (paymentHistoryFinishToday) {
    isFinishToday = true;
  }

  return { latePaymentDay, latePaymentMoney, badDebitMoney, isFinishToday };
};

export const calculateLateAndBadPaymentPawn = (
  paymentHistories: PaymentHistory[],
  debitStatus: string,
) => {
  let latePaymentPeriod = 0;
  let latePaymentMoney = 0;
  let badDebitMoney = 0;
  let isFinishPaymentPeriod = false;

  const today = formatDate(new Date());

  const sortPaymentHistories = paymentHistories.sort(
    (p1, p2) => p1.rowId - p2.rowId,
  );

  const lastPaymentHistoryPeriodUnFinish = sortPaymentHistories.find(
    (paymentHistory) => isLastPaymentHistoryPeriodUnFinish(paymentHistory),
  );

  if (lastPaymentHistoryPeriodUnFinish) {
    latePaymentPeriod = sortPaymentHistories.reduce((total, paymentHistory) => {
      if (isLastPaymentHistoryPeriodUnFinish(paymentHistory)) {
        return total + 1;
      }
      return total;
    }, 0);

    latePaymentMoney = sortPaymentHistories.reduce((total, paymentHistory) => {
      if (isLastPaymentHistoryPeriodUnFinish(paymentHistory)) {
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
    isFinishPaymentPeriod = true;
  }

  return {
    latePaymentPeriod,
    latePaymentMoney,
    badDebitMoney,
    isFinishPaymentPeriod,
  };
};