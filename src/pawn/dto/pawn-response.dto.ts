import { Pawn } from '../pawn.entity';

export class PawnResponseDto extends Pawn {
  moneyPaid: number;
  moneyOnePeriod: number;
  latePaymentMoney: number;
  badDebitMoney: number;
  latePaymentPeriod: number;
  interestDayToday: number;
  interestMoneyToday: number;
}
