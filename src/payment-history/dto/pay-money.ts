import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PayMoneyDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  rowId?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  totalPaymentAmount?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  customerPaymentAmount?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  paymentStatus?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  payDate?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;
}
