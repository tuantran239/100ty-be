import { BatHo } from '../bat-ho.entity';

export class BatHoResponseDto extends BatHo {
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
