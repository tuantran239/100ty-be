import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupCashDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cashType: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  status?: string;
}
