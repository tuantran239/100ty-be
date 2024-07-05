import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseUpdateDto } from 'src/common/dto/base-update.dto';

export class UpdateDeviceDto extends BaseUpdateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsOptional()
  rangePrice: number[];
}
