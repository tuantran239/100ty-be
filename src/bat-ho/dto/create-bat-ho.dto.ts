import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Partner, ServiceFee } from 'src/bat-ho/bat-ho.type';
import { BaseStoreCreateDto } from 'src/common/dto/base-store-create.dto';
import { CreateCustomerDto } from 'src/customer/dto/create-customer.dto';

export class CreateBatHoDto extends BaseStoreCreateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  customerId?: string;

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
  oldContractId?: string;

  @ApiProperty()
  @IsOptional()
  customer?: CreateCustomerDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @ApiProperty()
  @IsOptional()
  debitStatus?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  loanAmount: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  fundedAmount: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  revenueReceived: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  loanDurationDays: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  deductionDays: number;

  @ApiProperty()
  @IsOptional()
  noteContract?: string;

  @ApiProperty()
  @IsNotEmpty()
  loanDate: string;

  @ApiProperty()
  @IsOptional()
  serviceFee?: ServiceFee;

  @ApiProperty()
  @IsOptional()
  partner?: Partner;

  @ApiProperty()
  @IsOptional()
  files?: any;

  @ApiProperty()
  @IsString()
  @IsOptional()
  imei?: string;
}
