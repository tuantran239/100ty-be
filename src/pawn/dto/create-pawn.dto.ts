import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateCustomerDto } from 'src/customer/dto/create-customer.dto';

export class CreatePawnDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userId: string;

  @ApiProperty()
  @IsOptional()
  customer?: CreateCustomerDto;

  @ApiProperty()
  @IsOptional()
  assetTypeId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  assetName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  loanPaymentType: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  loanAmount: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  paymentPeriod: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentPeriodType: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  numOfPayment: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  loanDate: string;

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
  @IsNotEmpty()
  interestMoney: number;

  @ApiProperty()
  @IsOptional()
  files?: any;

  @ApiProperty()
  @IsOptional()
  pawnInfo?: Record<string, unknown>;
}
