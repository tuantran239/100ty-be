export enum TransactionHistoryType {
  CLOSE_CONTRACT = 'close_contract',
  PAYMENT = 'payment',
  CANCEL = 'cancel',
  CREATE_CONTRACT = 'create_contract',
  PAYMENT_DOWN_ROOT_MONEY = 'payment_down_root_money',
}

export enum PaymentStatusHistory {
  FINISH = 'finish',
  UNFINISH = 'unfinish',
}

export enum PaymentHistoryType {
  DOWN_ROOT_MONEY = 'down_root_money',
  ADD_ROOT_MONEY = 'add_root_money',
  OTHER_MONEY = 'other_money',
}
