import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseUpdateDto } from 'src/common/dto/base-update.dto';

export class UpdateWorkspaceDto extends BaseUpdateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  status?: string;
}
