import { BaseStoreQueryDto } from "src/common/dto/base-store-query.dto";

export class ListAssetQueryDto extends BaseStoreQueryDto {
  search?: string;
  status?: string;
}
