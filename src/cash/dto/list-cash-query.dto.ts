import { BaseStoreQueryDto } from "src/common/dto/base-store-query.dto";

export class ListCashQueryDto extends BaseStoreQueryDto {
  fromDate?: string;
  toDate?: string;
  traders?: string;
  staff?: string;
  contractType?: string;
  type: 'payment' | 'receipt' | null;
  groupId?: string;
  isContract?: boolean;
}
