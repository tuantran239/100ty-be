import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BaseCreateDto } from 'src/common/dto/base-create.dto';

export class CreateAssetTypeDto extends BaseCreateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  properties: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  status?: string;
}
