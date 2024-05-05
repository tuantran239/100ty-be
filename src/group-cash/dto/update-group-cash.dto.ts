import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

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
}
