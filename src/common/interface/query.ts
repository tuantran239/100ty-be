export interface BaseQuery {
  page?: number;
  pageSize?: number;
}

export interface DateQuery extends BaseQuery {
  fromDate?: string;
  toDate?: string;
}

export interface CashQuery extends DateQuery {
  traders?: string;
  staff?: string;
  contractType?: string;
  type: 'payment' | 'receipt' | null;
  groupId?: string;
  isContract?: boolean;
}

export interface BatHoQuery extends DateQuery {
  debitStatus?: string;
  search?: string;
  device?: string;
  hostServer?: string;
  receiptToday?: boolean;
}

export interface CustomerQuery extends BaseQuery {
  search?: string;
  isDebt?: boolean;
}

export interface PaymentHistoryQuery extends BaseQuery {
  contractId: string;
}

export interface UserQuery extends BaseQuery {
  search?: string;
}

export interface CashTotalQuery {}

export interface LogActionQuery extends BaseQuery {
  type?: string;
}

export interface StatisticsFeeServiceQuery extends BaseQuery {
  type?: 'user' | 'admin';
}

export interface PaymentHistoryFinishQuery extends BaseQuery {
  search?: string;
}

export interface StatisticsContractQuery extends BaseQuery {
  type?: string;
}

export interface CashCSVQuery {
  type?: string;
  isContract?: boolean;
}

export interface GroupCashQuery extends BaseQuery {
  status?: string;
}
