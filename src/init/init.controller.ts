import {
  Controller,
  InternalServerErrorException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { InitRouter } from './init.router';
import {  Response } from 'express';
import { RequestCustom } from 'src/common/types/http';
import { ResponseData } from 'src/common/types';
import { InitService } from './init.service';
import { InitNewWorkspaceDto } from './dto/init-new-workspace.dto';

@Controller(InitRouter.ROOT)
export class InitController {
  constructor(private initService: InitService) {}

  @Post(InitRouter.NEW_WORKSPACE)
  async initNewWorkspace(@Req() req: RequestCustom, @Res() res: Response) {
    try {
      const workspace = await this.initService.InitNewWorkspace(
        req.body as InitNewWorkspaceDto,
      );

      const responseData: ResponseData = {
        message: 'success',
        data: workspace,
        error: null,
        statusCode: 200,
      };

      return res.status(200).send(responseData);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post(InitRouter.WORKSPACE_100TY_UPDATE)
  async initWorkspace100tyAndUpdate(@Req() req: RequestCustom, @Res() res: Response) {
    try {
      const data = await this.initService.InitWorkspace100tyAndUpdate();

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
