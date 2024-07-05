import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseUpdateDto } from 'src/common/dto/base-update.dto';

export class UpdateAssetTypeDto extends BaseUpdateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty()
  @IsOptional()
  properties?: string[];
}
