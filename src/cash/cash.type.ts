export enum CashType {
  RECEIPT = 'receipt',
  PAYMENT = 'payment',
}

export interface ISummarizeCashContractDetail {
  label: string;
  key: string;
  receiptTotal: number;
  paymentTotal: number;
  groupCash: Array<{
    label: string;
    key: string;
    cashType: string;
    total: number;
  }>;
}

export interface ISummarizeCashContract {
  all: { receiptTotal: number; paymentTotal: number };
  details: Array<ISummarizeCashContractDetail>;
}

export interface ContractCash {
  contractType: string;
  id: string;
  date: string;
  amount: number;
  contractId: string;
}
