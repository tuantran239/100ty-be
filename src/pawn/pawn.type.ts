import { Customer } from 'src/customer/customer.entity';
import { ExtendedPeriodHistory } from 'src/extended-period-history/extended-period-history.entity';
import { ServiceFee } from '../bat-ho/bat-ho.type';
import { Pawn } from 'src/pawn/pawn.entity';

export enum PawnPaymentPeriodType {
  DAY = 'day',
  MOTH = 'month',
  WEEK = 'week',
  REGULAR_MOTH = 'regular_month',
}

export enum PawnInterestType {
  LOAN_MIL_DAY = 'loan/mil/day',
  LOAN_DAY = 'loan/day',
  LOAN_PERCENT_MONTH = 'loan-percent/month',
  LOAN_PERIOD = 'loan/period',
  LOAN_PERCENT_PERIOD = 'loan-percent/period',
  LOAN_WEEK = 'loan/week',
  LOAN_PERCENT_WEEK = 'loan-percent/week',
}

export interface TotalMoneyPaymentHistory {
  totalMoneyPaid: number;
  totalMoneyMustPay: number;
}

export interface SettlementPawnContractInfo {
  contractId: string;
  loanAmount: number;
  interestRate: string;
  contractType: string;
  loanDate: string;
  totalMoneyMustPay: number;
  moneyPaid: number;
  moneyMustReceipt: number;
  interestDay: number;
  interestMoney: number;
  note: string;
}

export interface SettlementPawnInfo {
  customer: string;
  paymentDate: string;
  settlementMoney: number;
  serviceFee: ServiceFee[];
}

export interface SettlementPawn {
  paymentHistories: any[];
  contractInfo: SettlementPawnContractInfo;
  settlementInfo: SettlementPawnInfo;
  totalMoney: TotalMoneyPaymentHistory;
}

export interface PaymentDownRootMoneyHistory {
  customer: string;
  paymentDate: string;
  paymentMoney: number;
  ortherFee: number;
  note: string;
}

export interface PaymentDownRootContractInfo {
  contractId: string;
  customer: string;
  birthdayDate: string;
  address: string;
  loanAmount: number;
  loanDate: string;
  interestRate: string;
  contractType: string;
  interestMoney: number;
}

export interface PaymentDownRootMoney {
  paymentHistories: any[];
  transactionHistories: PaymentDownRootMoneyHistory[];
  contractInfo: PaymentDownRootContractInfo;
  customer: Customer | any;
  totalMoney: TotalMoneyPaymentHistory;
}

export interface LoanMoreMoneyHistory {
  customer: string;
  paymentDate: string;
  loanMoney: number;
  ortherFee: number;
  note: string;
}

export interface LoanMoreMoneyContractInfo {
  contractId: string;
  customer: string;
  birthdayDate: string;
  address: string;
  loanAmount: number;
  loanDate: string;
  interestRate: string;
  contractType: string;
  interestMoney: number;
}

export interface LoanMoreMoney {
  paymentHistories: any[];
  transactionHistories: LoanMoreMoneyHistory[];
  contractInfo: LoanMoreMoneyContractInfo;
  customer: Customer | any;
  totalMoney: TotalMoneyPaymentHistory;
}

export interface PawnExtendPeriod {
  paymentHistories: any[];
  histories: ExtendedPeriodHistory[];
  contractId: string;
  totalMoney: TotalMoneyPaymentHistory;
}

export interface PawnResponse extends Omit<Pawn, 'beforeInsert'> {
  moneyPaid: number;
  moneyOnePeriod: number;
  latePaymentMoney: number;
  badDebitMoney: number;
  latePaymentPeriod: number;
  interestDayToday: number;
  interestMoneyToday: number;
}

export interface PaymentHistoryResponse {
  id: string;
  rowId: number;
  startDate: string;
  endDate: string;
  totalPaymentAmount: number;
  customerPaymentAmount: number;
  paymentStatus: boolean;
  payDate: string | null;
}

export enum PawnPaymentType {
  BEFORE = 'before',
  AFTER = 'after',
}
