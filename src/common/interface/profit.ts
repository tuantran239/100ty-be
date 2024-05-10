export interface ProfitCash {
  key: string;
  label: string;
  value: number;
}

export interface ProfitData {
  receipt: {
    details: ProfitCash[];
    total: number;
  };
  payment: {
    details: ProfitCash[];
    total: number;
  };
  interest: number;
}

export interface ProfitChartDetailItem {
  detail: ProfitData;
  type: 'month' | 'date';
  date: number | string;
}

export interface ProfitChartDetail {
  minInterest: number;
  maxInterest: number;
  items: ProfitChartDetailItem[];
}

export interface ProfitStatistics {
  overview: ProfitData;
  chartDetail: ProfitChartDetail;
}
