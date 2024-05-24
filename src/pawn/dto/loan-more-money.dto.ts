import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class LoanMoreMoneyDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  loanMoney: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  loanDate: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  otherMoney: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;
}
