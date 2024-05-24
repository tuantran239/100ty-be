import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { ServiceFee } from './bat-ho';
import { Customer } from 'src/customer/customer.entity';

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

export enum AssetTypeStatus {
  ACTIVE = 'active',
  OFF = 'off',
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
  paymentHistories: PaymentHistory[];
  contractInfo: SettlementPawnContractInfo;
  settlementInfo: SettlementPawnInfo;
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
  paymentHistories: PaymentHistory[];
  transactionHistories: PaymentDownRootMoneyHistory[];
  contractInfo: PaymentDownRootContractInfo;
  customer: Customer | any;
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
  paymentHistories: PaymentHistory[];
  transactionHistories: LoanMoreMoneyHistory[];
  contractInfo: LoanMoreMoneyContractInfo;
  customer: Customer | any;
}
