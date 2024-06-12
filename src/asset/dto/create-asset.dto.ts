import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAssetDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  assetCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  assetName: string;

  @ApiProperty()
  @IsNotEmpty()
  loanAmount: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  pawnId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  warehouseId?: string;
}
