import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty()
  @IsOptional()
  permissions?: any;
}
