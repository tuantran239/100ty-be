import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BaseCreateDto } from 'src/common/dto/base-create.dto';

export class CreateLogActionDto extends BaseCreateDto  {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty()
  @IsNotEmpty()
  agent: Record<string, unknown>;

  @ApiProperty()
  @IsOptional()
  payload?: Record<string, unknown>;

  @ApiProperty()
  @IsOptional()
  data?: Record<string, unknown>;
}
