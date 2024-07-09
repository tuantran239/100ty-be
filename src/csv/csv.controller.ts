import {
  Controller,
  Get,
  InternalServerErrorException,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {  Response } from 'express';
import { RequestCustom } from 'src/common/types/http';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CashCSVQuery } from 'src/common/types/query';
import { CsvService } from './csv.service';
import { CsvRouter } from './csv.router';

@Controller(CsvRouter.ROOT)
export class CsvController {
  constructor(private csvService: CsvService) {}

  @UseGuards(JwtAuthGuard)
  @Get(CsvRouter.EXPORT_CASH)
  async getCashFilterType(@Res() res: Response, @Req() req: RequestCustom) {
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
