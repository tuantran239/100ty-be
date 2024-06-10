export class ListBatHoQueryDto {
  fromDate?: string;
  toDate?: string;
  debitStatus?: string;
  search?: string;
  device?: string;
  hostServer?: string;
  receiptToday?: boolean;
  page?: number;
  pageSize?: number;
}
