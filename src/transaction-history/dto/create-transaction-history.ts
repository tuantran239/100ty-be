import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTransactionHistoryDto {
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
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  otherMoney?: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  moneySub: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  moneyAdd: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;
}
