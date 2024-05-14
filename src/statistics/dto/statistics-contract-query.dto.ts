import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class StatisticsContractQueryDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  year: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  month?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  day?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  search?: string;
}
