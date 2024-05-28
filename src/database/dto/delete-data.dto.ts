import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteDataDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  repository: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  id?: string;
}
