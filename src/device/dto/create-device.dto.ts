import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { BaseCreateDto } from 'src/common/dto/base-create.dto';

export class CreateDeviceDto extends BaseCreateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  rangePrice: number[];
}
