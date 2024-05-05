import {
  Controller,
  Get,
  InternalServerErrorException,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import RouterUrl from 'src/common/constant/router';
import { CsvService } from './csv.service';
import { CashCSVQuery } from 'src/common/interface/query';

@Controller(RouterUrl.CSV.ROOT)
export class CsvController {
  constructor(private csvService: CsvService) {}

  @UseGuards(JwtAuthGuard)
  @Get(RouterUrl.CSV.EXPORT_CASH)
  async getCashFilterType(@Res() res: Response, @Req() req: Request) {
    try {
      const query = req.query as CashCSVQuery;

      const data = await this.csvService.exportCashCSV(query);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachement: filename=thu_chi.csv');

      return res.status(200).send(data);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
