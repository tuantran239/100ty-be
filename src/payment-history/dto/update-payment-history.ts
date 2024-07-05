import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseStoreUpdateDto } from 'src/common/dto/base-store-update.dto';

export class UpdatePaymentHistoryDto extends BaseStoreUpdateDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  rowId?: number;

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
  paymentStatus?: string;

  @ApiProperty()
  @IsOptional()
  payDate?: string;

  @ApiProperty()
  @IsOptional()
  startDate?: string;

  @ApiProperty()
  @IsOptional()
  endDate?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  paymentMethod?: string;

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
  @IsOptional()
  payMoney?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  payNeed?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type?: string;
}
