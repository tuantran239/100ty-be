import * as moment from 'moment';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { Role } from 'src/role/entities/role.entity';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
import { User } from 'src/user/user.entity';
import { UserResponseData } from '../interface/response';
import { Cash } from './../../cash/cash.entity';
import { getFullName } from './get-full-name';
import { formatDate } from './time';

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
