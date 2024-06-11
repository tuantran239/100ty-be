import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCashDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  staff?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  traders?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  filterType?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty()
  @IsOptional()
  createAt?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isPartner?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isServiceFee?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isInitCash?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  contractId?: string;
}
