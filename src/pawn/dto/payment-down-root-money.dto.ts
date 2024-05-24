import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PaymentDownRootMoneyDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  paymentMoney: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentDate: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  otherMoney: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;
}
