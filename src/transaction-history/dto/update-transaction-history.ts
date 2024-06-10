import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTransactionHistoryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  batHoId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  contractId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  otherMoney?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  moneySub?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  moneyAdd?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  createdAt?: string;
}
