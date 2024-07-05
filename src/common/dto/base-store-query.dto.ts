import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from './base-query.dto';

export class BaseStoreQueryDto extends BaseQueryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  storeId?: string;
}
