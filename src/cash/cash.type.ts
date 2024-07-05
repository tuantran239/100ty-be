export enum CashType {
  RECEIPT = 'receipt',
  PAYMENT = 'payment',
}

export interface SummarizeGroupCashDetail {
  label: string;
  key: string;
  cashType: string;
  total: number;
}

export interface ISummarizeCashContractDetail {
  label: string;
  key: string;
  receiptTotal: number;
  paymentTotal: number;
  groupCashDetails: Array<SummarizeGroupCashDetail>;
}

export interface ISummarizeCashContract {
  all: {
    receiptTotal: number;
    paymentTotal: number;
    groupCashDetails: Array<SummarizeGroupCashDetail>;
  };
  details: Array<ISummarizeCashContractDetail>;
}

export interface ISummarizeCashOutSite {
  receiptTotal: number;
  paymentTotal: number;
  groupCashDetails: Array<SummarizeGroupCashDetail>;
}

export interface ContractCash {
  contractType: string;
  id: string;
  date: string;
  amount: number;
  contractId: string; 
  storeId: string;
}

export enum CashFilterType {
  CONTRACT = 'contract',
  ORTHER = 'orther',
  PAYMENT_CONTRACT = 'payment_contract',
  RECEIPT_CONTRACT = 'receipt_contract',
  SERVICE_FEE = 'service_fee',
  PARTNER = 'partner',
  INIT = 'init',
  DEDUCTION = 'deduction',
  PAYMENT_ORTHER = 'payment_orther',
  RECEIPT_ORTHER = 'receipt_orther',
  PAY_ROLL = 'payroll',
  PAY_IP = 'payIp',
  IMEI = 'imei',
  LOAN_MORE_CONTRACT = 'loan_more_contract',
  DOWN_ROOT_MONEY = 'down_root_money',
}
