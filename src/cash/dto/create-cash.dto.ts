import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCashDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  staff: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  traders: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  filterType?: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  createAt: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isContract?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isPartner?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isServiceFee?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isInitCash?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  contractType?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  batHoId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  pawnId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  paymentHistoryId?: string;
}
