import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { User } from 'src/user/user.entity';

export class BaseDto {
  @ApiProperty()
  @IsOptional()
  me?: User;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  workspaceId?: string;
}
