import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReverseBatHoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  payDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @ApiProperty()
  @IsNotEmpty()
  dataLoan: any;
}
