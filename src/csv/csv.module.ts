import { Module } from '@nestjs/common';
import { CsvController } from './csv.controller';
import { CsvService } from './csv.service';

@Module({
  providers: [CsvService],
  controllers: [CsvController],
})
export class CsvModule {}
