import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SettlementBatHoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  payDate: string;
}
