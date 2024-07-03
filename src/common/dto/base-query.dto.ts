import { IsNumber, IsOptional } from 'class-validator';
import { BaseDto } from './base.dto';

export class BaseQueryDto extends BaseDto {
  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  pageSize?: number;
}
