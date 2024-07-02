import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { User } from 'src/user/user.entity';

export class UpdateGroupCashDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  groupName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  cashType?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  me?: User;
}
