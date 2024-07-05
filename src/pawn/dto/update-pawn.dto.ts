import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseStoreUpdateDto } from 'src/common/dto/base-store-update.dto';

export class UpdatePawnDto extends BaseStoreUpdateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  contractId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  interestType?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  assetName?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  loanAmount?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  rootMoney?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  paymentPeriod?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  paymentPeriodType?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  numOfPayment?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  loanDate?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  debitStatus?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  noteContract?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  interestMoney?: number;

  @ApiProperty()
  @IsOptional()
  files?: any;

  @ApiProperty()
  @IsOptional()
  pawnInfo?: Record<string, unknown>;

  @ApiProperty()
  @IsString()
  @IsOptional()
  settlementDate?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  startPaymentDate?: string;
}
