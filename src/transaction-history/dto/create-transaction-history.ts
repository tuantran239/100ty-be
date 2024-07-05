import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseStoreCreateDto } from 'src/common/dto/base-store-create.dto';

export class CreateTransactionHistoryDto extends BaseStoreCreateDto {
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
  @IsOptional()
  paymentHistoryId?: string;

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

  @ApiProperty()
  @IsString()
  @IsOptional()
  createAt?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  createdAt?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  contractType?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  moneyType?: string;
}
