import * as moment from 'moment';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { Pawn } from 'src/pawn/pawn.entity';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { Role } from 'src/role/entities/role.entity';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
import { User } from 'src/user/user.entity';
import { BatHoResponse, PawnResponse } from '../interface/bat-ho';
import { PaymentStatusHistory } from '../interface/history';
import { UserResponseData } from '../interface/response';
import { Cash } from './../../cash/cash.entity';
import {
  calculateInterestToTodayPawn,
  calculateLateAndBadPaymentIcloud,
  calculateLateAndBadPaymentPawn,
} from './calculate';
import { getFullName } from './get-full-name';
import { countFromToDate, countTimeMustPay, formatDate } from './time';

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
      cash: {
        ...cash,
        createAt: moment(new Date(cash.createAt)).format('DD/MM/YYYY') as any,
        admin,
        contractId,
        rootMoney,
        interestMoney,
        customer,
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

    const { latePaymentDay, latePaymentMoney, badDebitMoney, isFinishToday } =
      calculateLateAndBadPaymentIcloud(
        batHo.paymentHistories ?? [],
        batHo.debitStatus,
      );

    return {
      batHo: {
        ...batHo,
        loanDate: moment(new Date(batHo.loanDate)).format('DD/MM/YYYY') as any,
        timePayment,
        moneyPaid: `${moneyPaidNumber.toLocaleString()}${paidDuration ? `(${paidDuration}) kỳ` : ''}`,
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

export const mapPawnResponse = (
  pawn: Pawn | null,
): { pawn: PawnResponse } | null => {
  if (pawn) {
    const paymentHistories = pawn.paymentHistories;

    const moneyOnePeriod =
      paymentHistories.find((paymentHistory) => !paymentHistory.isRootMoney)
        ?.payNeed ?? 0;

    const moneyPaidNumber = paymentHistories.reduce((total, paymentHistory) => {
      if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
        return (total += paymentHistory.payMoney);
      }
      return total;
    }, 0);

    const { latePaymentMoney, latePaymentPeriod, badDebitMoney } =
      calculateLateAndBadPaymentPawn(
        pawn.paymentHistories ?? [],
        pawn.debitStatus,
      );

    const { interestDayToday, interestMoneyToday } =
      calculateInterestToTodayPawn(pawn);

    return {
      pawn: {
        ...pawn,
        moneyPaid: moneyPaidNumber,
        loanDate: moment(new Date(pawn.loanDate)).format('DD/MM/YYYY') as any,
        moneyOnePeriod,
        latePaymentMoney,
        latePaymentPeriod,
        badDebitMoney,
        interestDayToday,
        interestMoneyToday,
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
