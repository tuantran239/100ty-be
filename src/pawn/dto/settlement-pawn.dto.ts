import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ServiceFee } from 'src/common/interface/bat-ho';

export class SettlementPawnDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  settlementMoney: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentDate: string;

  @ApiProperty()
  @IsOptional()
  serviceFee?: ServiceFee[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;
}
