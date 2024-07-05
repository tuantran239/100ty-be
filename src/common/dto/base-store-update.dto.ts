import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseUpdateDto } from './base-update.dto';

export class BaseStoreUpdateDto extends BaseUpdateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  storeId?: string;
}
