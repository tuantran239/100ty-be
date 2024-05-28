import { TransactionHistoryType } from '../interface/history';

export const getContentTransactionHistory = (
  type: string,
  contractId: string,
) => {
  switch (type) {
    case TransactionHistoryType.DISBURSEMENT_NEW_CONTRACT:
      return `Giải ngân hợp hợp đồng mới ${contractId}`;
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
