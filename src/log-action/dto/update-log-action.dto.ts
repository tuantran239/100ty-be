import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateLogActionDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  action: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty()
  @IsOptional()
  agent: Record<string, unknown>;

  @ApiProperty()
  @IsOptional()
  payload: Record<string, unknown>;

  @ApiProperty()
  @IsOptional()
  data: Record<string, unknown>;
}
