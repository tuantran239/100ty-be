import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAssetDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  assetCode?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  assetName?: string;

  @ApiProperty()
  @IsOptional()
  loanAmount?: number;

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
