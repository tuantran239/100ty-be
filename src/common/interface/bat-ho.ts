import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { Pawn } from 'src/pawn/pawn.entity';

export enum BatHoPaymentMethod {
  DAY = 'day',
  MONTH = 'month',
}

export enum InterestPaymentType {
  BEFORE = 'before',
  AFTER = 'after',
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

export interface ServiceFee {
  name: string;
  value: any;
}

export interface Partner {
  name: string;
  partnerShareAmount: number;
}

export interface BatHoResponse extends Omit<BatHo, 'beforeInsert'> {
  timePayment: string;
  moneyPaid: string;
  oldDebit: number;
  moneyOneDay: number;
  moneyMustPay: string;
  dateMustPay: string;
  latePaymentDay: number;
  isFinishToday: boolean;
  latePaymentMoney: number;
  badDebitMoney: number;
}

export interface PawnResponse extends Omit<Pawn, 'beforeInsert'> {
  moneyPaid: number;
  moneyOnePeriod: number;
  latePaymentMoney: number;
  badDebitMoney: number;
  latePaymentPeriod: number;
  // moneyMustPay: string;
  // dateMustPay: string;
  // latePaymentDay: number;
  // isFinishToday: boolean;
  // latePaymentMoney: number;
  // badDebitMoney: number;
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
