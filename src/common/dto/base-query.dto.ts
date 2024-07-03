import { IsNumber, IsOptional } from 'class-validator';

export class BaseQueryDto {
  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  pageSize?: number;
}
