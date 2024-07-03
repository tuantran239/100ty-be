import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from './base.dto';

export class BaseUpdateDto extends BaseDto {
  @ApiProperty()
  id: string;
}
