import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseStoreUpdateDto } from 'src/common/dto/base-store-update.dto';

export class UpdateTransactionHistoryDto extends BaseStoreUpdateDto {
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

  @ApiProperty()
  @IsString()
  @IsOptional()
  moneyType?: string;
}
