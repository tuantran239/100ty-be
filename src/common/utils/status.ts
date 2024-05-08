import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { convertPostgresDate, formatDate } from './time';
import { PaymentStatusHistory } from '../interface/history';
import { DebitStatus } from '../interface/bat-ho';

export const getBatHoStatus = (paymentHistories: PaymentHistory[]): string => {
  const sortPaymentHistories = paymentHistories.sort(
    (a, b) => a.rowId - b.rowId,
  );

  const today = formatDate(new Date());

  const lastPaymentHistory =
    sortPaymentHistories[sortPaymentHistories.length - 1];

  const todayTime = new Date(
    convertPostgresDate(formatDate(new Date())),
  ).setHours(0, 0, 0, 0);

  const lastTime = new Date(
    convertPostgresDate(
      formatDate(lastPaymentHistory?.startDate ?? new Date()),
    ),
  ).setHours(0, 0, 0, 0);

  const allFinish = sortPaymentHistories.every(
    (paymentHistory) =>
      paymentHistory.paymentStatus === PaymentStatusHistory.FINISH,
  );

  const isNotNull = sortPaymentHistories.some(
    (paymentHistory) => paymentHistory.paymentStatus === null,
  );

  if (allFinish) {
    return DebitStatus.COMPLETED;
  }

  if (!isNotNull) {
    return DebitStatus.BAD_DEBIT;
  }

  if ((todayTime - lastTime) / 86400000 >= 1) {
    return DebitStatus.BAD_DEBIT;
  } else {
    const notFinishPaymentHistory = sortPaymentHistories.find(
      (paymentHistory) =>
        paymentHistory.paymentStatus !== PaymentStatusHistory.FINISH &&
        formatDate(paymentHistory.startDate) !== today &&
        new Date(paymentHistory.startDate).getTime() <
          new Date(convertPostgresDate(today)).getTime(),
    );

    if (notFinishPaymentHistory) {
      const timeNot = new Date(
        convertPostgresDate(
          formatDate(notFinishPaymentHistory?.startDate ?? new Date()),
        ),
      ).getTime();

      if (timeNot > lastTime) {
        return DebitStatus.BAD_DEBIT;
      } else {
        return DebitStatus.LATE_PAYMENT;
      }
    }
  }

  return DebitStatus.IN_DEBIT;
};

export const getPawnStatus = (paymentHistories: PaymentHistory[]): string => {
  const sortPaymentHistories = paymentHistories.sort(
    (a, b) => a.rowId - b.rowId,
  );

  const today = formatDate(new Date());

  const lastPaymentHistory =
    sortPaymentHistories[sortPaymentHistories.length - 1];

  const todayTime = new Date(
    convertPostgresDate(formatDate(new Date())),
  ).setHours(0, 0, 0, 0);

  const lastTime = new Date(
    convertPostgresDate(formatDate(lastPaymentHistory?.endDate ?? new Date())),
  ).setHours(0, 0, 0, 0);

  const allFinish = sortPaymentHistories.every(
    (paymentHistory) =>
      paymentHistory.paymentStatus === PaymentStatusHistory.FINISH,
  );

  const isNotNull = sortPaymentHistories.some(
    (paymentHistory) => paymentHistory.paymentStatus === null,
  );

  if (allFinish) {
    return DebitStatus.COMPLETED;
  }

  if (!isNotNull) {
    return DebitStatus.BAD_DEBIT;
  }

  if ((todayTime - lastTime) / 86400000 >= 1) {
    return DebitStatus.BAD_DEBIT;
  } else {
    const notFinishPaymentHistory = sortPaymentHistories.find(
      (paymentHistory) =>
        paymentHistory.paymentStatus !== PaymentStatusHistory.FINISH &&
        formatDate(paymentHistory.endDate) !== today &&
        new Date(paymentHistory.endDate).getTime() <
          new Date(convertPostgresDate(today)).getTime(),
    );

    if (notFinishPaymentHistory) {
      const timeNot = new Date(
        convertPostgresDate(
          formatDate(notFinishPaymentHistory?.endDate ?? new Date()),
        ),
      ).getTime();

      if (timeNot > lastTime) {
        return DebitStatus.BAD_DEBIT;
      } else {
        return DebitStatus.LATE_PAYMENT;
      }
    }
  }

  return DebitStatus.IN_DEBIT;
};
