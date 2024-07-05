import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BaseDto } from 'src/common/dto/base.dto';

export class ExtendedPeriodConfirmDto extends BaseDto {
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
