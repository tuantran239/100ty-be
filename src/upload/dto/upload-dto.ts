import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  folder: string;
}
