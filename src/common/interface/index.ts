export interface ResponseData {
  message: 'success' | 'error';
  data: any | null;
  error: any | null;
  statusCode: number;
}

export enum RoleName {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
}

export enum RoleId {
  SUPER_ADMIN = 'role_super_admin',
  ADMIN = 'role_admin',
  USER = 'role_user',
}

export interface RoleData {
  name: string;
  permissions: any;
  level: number;
  link: string;
  id: string;
}

export enum CashType {
  RECEIPT = 'receipt',
  PAYMENT = 'payment',
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

export enum StatisticsContractFilter {
  TOTAL_DISBURSEMENT = 'total_disbursement',
  TOTAL_MUST_RECEIPT = 'total_must_receipt',
  TOTAL_BAD_DEBIT = 'total_bad_debit',
  TOTAL_RECEIPT = 'total_receipt',
  TOTAL_DEDUCTION = 'total_deduction',
  TOTAL_INTEREST = 'total_interest',
}

export interface StatisticsContractItem {
  customer: string;
  employee: string;
  contractId: string;
  amount: number;
}

export interface StatisticsContractResponse {
  totalPage: number;
  totalMoney: number;
  list_contract: StatisticsContractItem[];
}

export enum GroupCashStatus {
  ACTIVE = 'active',
  OFF = 'off',
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
}
