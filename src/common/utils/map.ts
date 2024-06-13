import * as moment from 'moment';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { Role } from 'src/role/entities/role.entity';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
import { User } from 'src/user/user.entity';
import { UserResponseData } from '../interface/response';
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
