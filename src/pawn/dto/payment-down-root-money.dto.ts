import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseDto } from 'src/common/dto/base.dto';

export class PaymentDownRootMoneyDto extends BaseDto {
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
