import { TransactionHistoryType } from '../interface/history';

export const getContentTransactionHistory = (type: string) => {
  switch (type) {
    case TransactionHistoryType.CREATE_CONTRACT:
      return 'Tạo mới hợp đồng';
    case TransactionHistoryType.CLOSE_CONTRACT:
      return 'Đóng hợp đồng';
    case TransactionHistoryType.CANCEL:
      return 'Huỷ đóng lãi';
    case TransactionHistoryType.PAYMENT:
      return 'Đóng tiền lãi';
    default:
      return '';
  }
};

export const getNoteTransactionHistory = (type: string, startDate?: string) => {
  if (
    (
      [
        TransactionHistoryType.CANCEL,
        TransactionHistoryType.PAYMENT,
      ] as string[]
    ).includes(type)
  ) {
    return `${startDate}`;
  }
  return '';
};
