import * as moment from 'moment';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { Role } from 'src/role/entities/role.entity';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
import { User } from 'src/user/user.entity';
import { BatHoResponse, DebitStatus } from '../interface/bat-ho';
import { PaymentStatusHistory } from '../interface/history';
import { UserResponseData } from '../interface/response';
import { Cash } from './../../cash/cash.entity';
import { getFullName } from './get-full-name';
import {
  convertPostgresDate,
  countFromToDate,
  countTimeMustPay,
  formatDate,
} from './time';

export const mapUserResponse = (
  user: User | null,
  roles: Role[] | null,
  permissionsData: any | null,
): { user: UserResponseData } | null => {
  if (user) {
    const role = roles ? roles[0] : null;

    let permissions = [];

    if (role) {
      if (permissionsData) {
        permissions = permissionsData;
      } else {
        permissions = role?.permissions?.data ?? [];
      }
      role.permissions = {};
    }

    const userData = {
      ...user,
      role,
      password: undefined,
      permissions,
    };

    return { user: { ...userData, roles: undefined, password: undefined } };
  }
  return null;
};

export const mapCashResponse = (cash: Cash | null): { cash: any } | null => {
  if (cash) {
    let admin = '';

    if (cash.batHo?.customer) {
      cash.traders =
        getFullName(
          cash.batHo?.customer.firstName,
          cash.batHo?.customer.lastName,
        ) ?? '';
    }

    if (cash.batHo?.user) {
      cash.staff = cash.batHo?.user?.fullName ?? cash.batHo.user.username;
    }

    if (cash.batHo?.user?.manager) {
      admin =
        cash.batHo?.user?.manager?.fullName ?? cash.batHo.user.manager.username;
    }

    return {
      cash: {
        ...cash,
        createAt: moment(new Date(cash.createAt)).format('DD/MM/YYYY') as any,
        admin,
        contractId: cash.batHo?.contractId ?? '',
      },
    };
  }
  return null;
};

export const mapBatHoResponse = (
  batHo: BatHo | null,
): { batHo: BatHoResponse } | null => {
  if (batHo) {
    const { loanDurationDays, loanDate, revenueReceived } = batHo;

    const paymentMethod = 'day';
    const numberOfPayments = 1;

    let isFinishToday = false;

    const dates = countFromToDate(
      loanDurationDays - 1,
      paymentMethod as any,
      0,
      loanDate,
    );

    const timePayment = `${formatDate(dates[0])} -> ${formatDate(dates[1])} (${loanDurationDays} ngày)`;

    const duration = Math.round(loanDurationDays / numberOfPayments);
    let paidDuration = 0;

    const paymentHistories = batHo.paymentHistories;

    const moneyPaidNumber = paymentHistories.reduce((total, paymentHistory) => {
      if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
        paidDuration += 1;
        return (total += paymentHistory.payMoney);
      }
      return total;
    }, 0);

    const paymentHistory = paymentHistories.find(
      (paymentHistory) => !paymentHistory.paymentStatus,
    );

    let latePaymentDay = 0;
    let latePaymentMoney = 0;
    let badDebitMoney = 0;

    const today = formatDate(new Date());

    const lastPaymentHistoryUnfinish = batHo.paymentHistories
      .sort((p1, p2) => p1.rowId - p2.rowId)
      .find(
        (paymentHistory) =>
          (paymentHistory.paymentStatus == PaymentStatusHistory.UNFINISH ||
            paymentHistory.paymentStatus == null) &&
          formatDate(paymentHistory.startDate) !== today &&
          new Date(paymentHistory.startDate).getTime() <
            new Date(convertPostgresDate(today)).getTime(),
      );

    if (lastPaymentHistoryUnfinish) {
      latePaymentDay = Math.round(
        (new Date(convertPostgresDate(today)).getTime() -
          new Date(lastPaymentHistoryUnfinish.startDate).getTime()) /
          86400000,
      );

      latePaymentMoney = batHo.paymentHistories
        .sort((p1, p2) => p1.rowId - p2.rowId)
        .reduce((total, paymentHistory) => {
          if (
            (paymentHistory.paymentStatus == PaymentStatusHistory.UNFINISH ||
              paymentHistory.paymentStatus == null) &&
            formatDate(paymentHistory.startDate) !== today &&
            new Date(paymentHistory.startDate).getTime() <
              new Date(convertPostgresDate(today)).getTime()
          ) {
            return paymentHistory.payNeed + total;
          }
          return total;
        }, 0);
    }

    const paymentHistoryFinishToday = batHo.paymentHistories.find(
      (paymentHistory) =>
        paymentHistory.paymentStatus == PaymentStatusHistory.FINISH &&
        formatDate(paymentHistory.startDate) == today,
    );

    if (paymentHistoryFinishToday) {
      isFinishToday = true;
    }

    if (batHo.debitStatus == DebitStatus.BAD_DEBIT) {
      badDebitMoney = batHo.paymentHistories.reduce((total, paymentHistory) => {
        if (paymentHistory.paymentStatus != PaymentStatusHistory.FINISH) {
          return total + paymentHistory.payNeed;
        }
        return total;
      }, 0);
    }

    return {
      batHo: {
        ...batHo,
        loanDate: moment(new Date(batHo.loanDate)).format('DD/MM/YYYY') as any,
        timePayment,
        moneyPaid: `${moneyPaidNumber.toLocaleString()}${paidDuration ? ` (${paidDuration}) kỳ` : ''}`,
        oldDebit: 0,
        moneyOneDay: parseInt((revenueReceived / loanDurationDays).toString()),
        moneyMustPay: `${(revenueReceived - moneyPaidNumber).toLocaleString()}${duration - paidDuration ? ` (${duration - paidDuration}) kỳ` : ''}`,
        dateMustPay: paymentHistory
          ? countTimeMustPay(paymentHistory.endDate)
          : '',
        latePaymentDay,
        isFinishToday,
        latePaymentMoney,
        badDebitMoney,
      },
    };
  }
  return null;
};

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
