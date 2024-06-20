export class ListCashQueryDto {
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
  traders?: string;
  staff?: string;
  contractType?: string;
  type: 'payment' | 'receipt' | null;
  groupId?: string;
  isContract?: boolean;
}
