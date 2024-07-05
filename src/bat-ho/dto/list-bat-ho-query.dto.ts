import { BaseStoreQueryDto } from 'src/common/dto/base-store-query.dto';

export class ListBatHoQueryDto extends BaseStoreQueryDto {
  fromDate?: string;

  toDate?: string;

  debitStatus?: string;

  search?: string;

  device?: string;

  hostServer?: string;

  receiptToday?: boolean;
}
