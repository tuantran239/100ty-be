import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseStoreUpdateDto } from 'src/common/dto/base-store-update.dto';

export class UpdateCustomerDto extends BaseStoreUpdateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty()
  @IsOptional()
  images?: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  personalID?: string;

  @ApiProperty()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty()
  @IsOptional()
  releaseDate?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  publishedPlace?: string;

  @ApiProperty()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty()
  @IsOptional()
  customerInfo?: Record<string, unknown>;

  @ApiProperty()
  @IsOptional()
  isDebt?: boolean;

  @ApiProperty()
  @IsOptional()
  debtMoney?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userId?: string;
}
