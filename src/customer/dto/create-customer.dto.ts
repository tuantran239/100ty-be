import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BaseStoreCreateDto } from 'src/common/dto/base-store-create.dto';

export class CreateCustomerDto extends BaseStoreCreateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsOptional()
  images?: any;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  personalID: string;

  @ApiProperty()
  @IsNotEmpty()
  phoneNumber: string;

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
  @IsString()
  @IsOptional()
  userId?: string;
}
