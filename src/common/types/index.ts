export interface ResponseData {
  message: 'success' | 'error';
  data: any | null;
  error: any | null;
  statusCode: number;
}

export enum DebitStatus {
  IN_DEBIT = 'inDebt',
  ON_TIME = 'onTime',
  LATE_PAYMENT = 'latePayment',
  COMPLETED = 'completed',
  BAD_DEBIT = 'badDebit',
  RISK_DEBIT = 'riskDebit',
  DELETED = 'deleted',
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

export enum ContractType {
  BAT_HO = 'bat_ho',
  CAM_DO = 'cam_do',
}

export interface paymentHistoriesCashItem {
  payMoney: number;
  payNeed: number;
  startDate: string;
  endDate: string;
  paymentStatus?: string;
  id: string;
}
export interface paymentHistoriesCash {
  data: paymentHistoriesCashItem[];
}
export interface ContractResponse {
  contractId: string;
  loanDate: string;
  debitStatus: string;
  loanAmount: number;
  latePaymentMoney: number;
  badDebitMoney: number;
  latePaymentDay: number;
  moneyMustPay: number;
  moneyPaid: number;
  contractType: string;
  revenueReceived: number;
  disbursementMoney: number;
}

export interface SummarizeOptions {
  date: { day?: number; month?: number; year?: number };
  type: 'day' | 'month' | 'year';
  user?: any;
}
