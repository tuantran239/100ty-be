import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { BaseCreateDto } from './base-create.dto';

export class BaseStoreCreateDto extends BaseCreateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  storeId: string;
}
