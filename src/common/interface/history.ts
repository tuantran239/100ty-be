export enum TransactionHistoryType {
  PAYMENT = 'payment',
  DISBURSEMENT_NEW_CONTRACT = 'disbursement_new_contract',
  DEDUCTION_MONEY = 'deduction_money',
  PAYMENT_DOWN_ROOT_MONEY = 'payment_down_root_money',
  LOAN_MORE_MONEY = 'loan_more_money',
  SETTLEMENT_CONTRACT = 'settlement_contract',
}

export enum PaymentStatusHistory {
  FINISH = 'finish',
  UNFINISH = 'unfinish',
}

export enum PaymentHistoryType {
  DOWN_ROOT_MONEY = 'down_root_money',
  LOAN_MORE_MONEY = 'loan_more_money',
  OTHER_MONEY_LOAN_MORE = 'other_money_loan_more',
  OTHER_MONEY_DOWN_ROOT = 'other_money_down_root',
  ROOT_MONEY = 'root_money',
  DEDUCTION_MONEY = 'deduction_money',
  INTEREST_MONEY = 'interest_money',
}
