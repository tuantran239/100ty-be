import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { User } from 'src/user/user.entity';

export class BaseUpdateDto {
  @ApiProperty()
  id: string;
}
