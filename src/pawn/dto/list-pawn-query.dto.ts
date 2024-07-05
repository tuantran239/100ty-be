import { BaseStoreQueryDto } from "src/common/dto/base-store-query.dto";

export class ListPawnQueryDto extends BaseStoreQueryDto {
  fromDate?: string;
  toDate?: string;
  debitStatus?: string;
  search?: string;
  receiptToday?: boolean; 
}
