export interface ServiceFeeDetail {
  contractId: string;
  customer: string;
  employee: string;
  fee: number;
}

export interface ServiceFeeItemStatistics {
  userName: string;
  totalContract: number;
  fee: number;
  details: ServiceFeeDetail[];
}

export interface ServiceFeeStatisticsResponse {
  totalFee: number;
  items: ServiceFeeItemStatistics[];
  totalPage: number;
}

export interface HomePreviewContractResponse {
  badDebitMoneyTotal: number;
  contractInDebitTotal: number;
  contractBadDebitTotal: number;
  contractCompleteTotal: number;
  expectedRevenue: number;
  receiptContract: number;
  deductionMoneyTotal: number;
  rootMoneyTotal: number;
  interestMoneyTotal: number;
  paymentContractTotal: number;
}

export interface ContractHomePreviewResponses {
  pawn: HomePreviewContractResponse;
  icloud: HomePreviewContractResponse;
}

export interface HomePreview {
  fundTotal: number;
  deductionMoneyTotal: number;
  partnerMoneyTotal: number;
  surplusMoney: number;
  expectedRevenue: number;
  paymentOrtherTotal: number;
  paymentContractTotal: number;
  paymentOffSiteTotal: number;
  receiptContract: number;
  badDebitMoneyTotal: number;
  storeTotal: number;
  contractTotal: number;
  customerTotal: number;
  serviceFeeTotal: number;
  employeeTotal: number;
  contractInDebitTotal: number;
  contractBadDebitTotal: number;
  contractCompleteTotal: number;
  contractResponses: ContractHomePreviewResponses;
  receiptContractWithDeductionMoney: number;
  moneyContractMustReceipt: number;
  moneyContractMustReceiptWithDeductionMoney: number;
}

type StatisticsOverviewDetail = {
  contractName: string;
  total: number;
  percent: number;
};

export interface StatisticsOverview {
  label: string;
  total: number;
  details: StatisticsOverviewDetail[];
}

export interface StatisticContractBaseQuery {
  month?: number;
  year: number;
  search?: string;
  day?: number;
}

export interface OverViewHomeToday {
  date: string;
  transactionsToday: number;
  loanToday: {
    contracts: number;
    amount: number;
  };
  loanReceiptToday: {
    contracts: number;
    amount: number;
  };
  expectedReceiptToday: {
    contracts: number;
    amount: number;
  };
  remainingFunds: number;
}

export interface TableStatisticsNewHomePreview {
  total: {
    contracts: number;
    loanAmount: number;
    interestReceipt: number;
    interestMonth: number;
  };
  details: Array<{
    key: string;
    label: string;
    contracts: number;
    loanAmount: {
      amount: number;
      percent: number;
    };
    interestReceipt: {
      amount: number;
      percent: number;
    };
    interestMonth: number;
  }>;
}

export interface PieChartStatisticsNewHomePreview {
  expectedInterest: Array<{
    key: string;
    label: string;
    amount: number;
    percent: number;
  }>;

  profitRate: Array<{
    key: string;
    label: string;
    amount: number;
    percent: number;
  }>;
}

export interface StatisticNewHomePreview {
  overview: OverViewHomeToday;
  tableStatistics: TableStatisticsNewHomePreview;
  pieChartStatistics: PieChartStatisticsNewHomePreview;
  contractAwaitingApproval: number;
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