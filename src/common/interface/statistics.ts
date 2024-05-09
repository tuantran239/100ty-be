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
