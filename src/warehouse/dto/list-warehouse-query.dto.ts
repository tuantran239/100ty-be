import { BaseStoreQueryDto } from 'src/common/dto/base-store-query.dto';

export class ListWarehouseQueryDto extends BaseStoreQueryDto {
  search?: string;
  status?: string;
}
