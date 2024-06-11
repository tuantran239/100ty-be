export class ListPawnQueryDto {
  fromDate?: string;
  toDate?: string;
  debitStatus?: string;
  search?: string;
  receiptToday?: boolean;
  page?: number;
  pageSize?: number;
}
