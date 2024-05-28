import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ExtendedPeriodConfirmDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  periodNumber: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  extendedDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}
