import { Customer } from 'src/customer/customer.entity';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { User } from 'src/user/user.entity';

export interface Contract {
  contractId: string;
  loanDate: string;
  debitStatus: string;
  loanAmount: number;
  latePaymentMoney: number;
  badDebitMoney: number;
  rootMoney: number;
  interestMoney: number;
  latePaymentDay: number;
  moneyMustPay: number;
  moneyPaid: number;
  disbursementMoney: number;
  deductionMoney: number;
  revenueReceived: number;
  contractType: string;
  paymentHistories: PaymentHistory[];
  customer: Customer;
  user: User;
}
