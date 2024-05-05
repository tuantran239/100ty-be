import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ServiceFee } from 'src/common/interface/bat-ho';

export class UpdateBatHoDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  hostServerId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  contractId?: string;

  @ApiProperty()
  @IsOptional()
  debitStatus?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  loanAmount?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  fundedAmount?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  revenueReceived?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  loanDurationDays?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  deductionDays?: number;

  @ApiProperty()
  @IsOptional()
  noteContract?: string;

  @ApiProperty()
  @IsOptional()
  loanDate?: string;

  @ApiProperty()
  @IsOptional()
  maturityDate?: string;

  @ApiProperty()
  @IsOptional()
  serviceFee?: ServiceFee;

  @ApiProperty()
  @IsOptional()
  files?: any;

  @ApiProperty()
  @IsString()
  @IsOptional()
  imei?: string;
}
