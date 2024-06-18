import { TransactionHistoryType } from '../../transaction-history/transaction-history.type';
import { TotalMoneyPaymentHistory } from '../../pawn/pawn.type';
import { PaymentStatusHistory } from 'src/payment-history/payment-history.type';

export const getContentTransactionHistory = (
  type: string,
  contractId: string,
) => {
  switch (type) {
    case TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT:
      return `Giải ngân hợp đồng mới ${contractId}`;
    case TransactionHistoryType.PAYMENT:
      return `Đóng tiền lãi hợp đồng ${contractId}`;
    case TransactionHistoryType.DEDUCTION_MONEY:
      return `Thu tiền cắt trước hợp đồng ${contractId}`;
    case TransactionHistoryType.LOAN_MORE_MONEY:
      return `Vay thêm tiền hợp đồng ${contractId}`;
    case TransactionHistoryType.PAYMENT_DOWN_ROOT_MONEY:
      return `Trả bớt tiền gốc hợp đồng ${contractId}`;
    case TransactionHistoryType.SETTLEMENT_CONTRACT:
      return `Tất toán hợp đồng ${contractId}`;
    default:
      return '';
  }
};

export const getNoteTransactionHistory = (type: string, startDate?: string) => {
  if (([TransactionHistoryType.PAYMENT] as string[]).includes(type)) {
    return `${startDate}`;
  }
  return '';
};

export const calculateTotalMoneyPaymentHistory = (
  paymentHistories: any[],
): TotalMoneyPaymentHistory => {
  const totalMoney: TotalMoneyPaymentHistory = {
    totalMoneyMustPay: 0,
    totalMoneyPaid: 0,
  };

  totalMoney.totalMoneyMustPay = paymentHistories.reduce(
    (total, paymentHistory) => total + paymentHistory.payNeed,
    0,
  );

  totalMoney.totalMoneyPaid = paymentHistories.reduce(
    (total, paymentHistory) => {
      if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
        return total + paymentHistory.payMoney;
      }
      return total;
    },
    0,
  );

  return totalMoney;
};
