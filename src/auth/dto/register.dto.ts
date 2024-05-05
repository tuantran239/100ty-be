import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

export class RegisterDto extends CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  role_id?: string;
}
