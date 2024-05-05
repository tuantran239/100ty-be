import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePaymentHistoryDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  rowId: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  batHoId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  pawnId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isDeductionMoney?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isRootMoney?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  paymentStatus: string;

  @ApiProperty()
  @IsOptional()
  payDate?: string;

  @ApiProperty()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contractType: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  interestMoney?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  otherMoney?: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  payMoney: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  payNeed: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;
}
