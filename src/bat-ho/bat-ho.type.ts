import { BatHo } from 'src/bat-ho/bat-ho.entity';

export enum BatHoPaymentMethod {
  DAY = 'day',
  MONTH = 'month',
}

export enum InterestPaymentType {
  BEFORE = 'before',
  AFTER = 'after',
}
export interface ServiceFee {
  name: string;
  value: number;
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
  moneyPaidNumber: number;
  moneyMustPayNumber: number;
}