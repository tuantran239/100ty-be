import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { BaseDto } from './base.dto';

export class BaseCreateDto extends BaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId: string;
}
