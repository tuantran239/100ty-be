import { Customer } from 'src/customer/customer.entity';
import { PaymentHistory } from 'src/payment-history/payment-history.entity';
import { TransactionHistory } from 'src/transaction-history/transaction-history.entity';
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
  summarize: SummarizeContract;
  settlementDate?: string;
  transactionHistories: TransactionHistory[];
}

export interface SummarizeContract {
  expected: {
    interestMoney: number;
    rootMoney: number;
    interestMoneyOneDay: number;
  };
  loan: {
    disbursementMoney: number;
    otherMoney: number;
    moreMoney: number;
  };
  receipt: {
    interestMoney: number;
    downRootMoney: number;
    otherMoney: number;
    deductionMoney: number;
    receiptMoney: number;
  };
}

export interface SummarizeContractType extends SummarizeContract {
  contractInDebit: {
    contracts: number;
    amount: number;
  };
  contractBadDebit: {
    contracts: number;
    amount: number;
  };
  contractCompleted: {
    contracts: number;
    amount: number;
  };
}

export interface SummarizeContractAmountDetail {
  label: string;
  contractType: string;
  total: number;
  summarizeDetail: SummarizeContractType;
}

export interface SummarizeContractAmount {
  allContract: { total: number; summarizeDetail: SummarizeContractType };
  details: Array<SummarizeContractAmountDetail>;
}

export interface SummarizeContractRangeTime {
  allContract: { total: number; summarizeDetail: SummarizeContract };
  details: Array<{
    label: string;
    contractType: string;
    summarizeDetail: SummarizeContract;
    total: number;
  }>;
}
