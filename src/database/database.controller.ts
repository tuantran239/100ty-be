import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CheckRoles } from 'src/common/decorator/roles.decorator';
import { DatabaseTokenGuard } from 'src/common/guard/database-token.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { ResponseData } from 'src/common/types';
import { BodyValidationPipe } from 'src/common/pipe/body-validation.pipe';
import { DatabaseService } from './database.service';
import { DeleteDataDto } from './dto/delete-data.dto';
import { RoleId, RoleName } from 'src/role/role.type';
import { DatabaseRouter } from './database.router';

@Controller(DatabaseRouter.ROOT)
export class DatabaseController {
  constructor(private databaseService: DatabaseService) {}

  @UseGuards(JwtAuthGuard, RolesGuard, DatabaseTokenGuard)
  @CheckRoles(
    {
      id: RoleId.SUPER_ADMIN,
      entity: null,
    }
  )
  @Post(DatabaseRouter.DELETE)
  async settlementRequest(
    @Body(new BodyValidationPipe()) payload: DeleteDataDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.databaseService.deleteData(payload);

      const responseData: ResponseData = {
        message: 'success',
        data,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
