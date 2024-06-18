import { Injectable } from '@nestjs/common';

import { Parser } from '@json2csv/plainjs';
import { filterTypesData } from 'src/cash/cash.controller';
import { CashFilterType } from 'src/common/types';
import { CashCSVQuery } from 'src/common/types/query';
import { formatDate } from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import { Equal, IsNull, Or } from 'typeorm';
import { CashType } from 'src/cash/cash.type';

@Injectable()
export class CsvService {
  constructor(private databaseService: DatabaseService) {}

  async exportCashCSV(query: CashCSVQuery) {
    const { type, isContract } = query;

    const repositories = await this.databaseService.getRepositories();

    const { cashRepository } = repositories;

    const cashes = await cashRepository.find({
      where: {
        type,
        isContract: isContract ? Equal(isContract) : Or(Equal(false), IsNull()),
        filterType: isContract
          ? Or(
              Equal(CashFilterType.PAYMENT_CONTRACT),
              Equal(CashFilterType.RECEIPT_CONTRACT),
            )
          : undefined,
      },
    });

    const cashCsvData = cashes.map((cash) => {
      const money = cash.amount.toLocaleString();

      let nameCash = '';

      if (cash.isContract) {
        if (cash.type === CashType.PAYMENT) {
          nameCash = 'Tiền giải ngân';
        } else {
          nameCash = 'Tiền thu hợp đồng';
        }
      } else {
        if (cash.type === CashType.PAYMENT) {
          const payment = filterTypesData.payment;

          const paymentFilter = payment.find(
            (p) => p.value === cash.filterType,
          );

          nameCash = paymentFilter?.label ?? 'Tiền chi';
        } else {
          const receipt = filterTypesData.receipt;

          const receiptFilter = receipt.find(
            (p) => p.value === cash.filterType,
          );

          nameCash = receiptFilter?.label ?? 'Tiền thu';
        }
      }

      return {
        'Ngày tạo phiếu': formatDate(cash.createAt),
        'Tên phiếu': nameCash,
        'Loại phiếu':
          cash.type === CashType.PAYMENT ? 'Phiếu chi' : 'Phiếu thu',
        'Ghi chú': cash.note,
        'Số tiền': money,
      };
    });

    const parser = new Parser({
      fields: [
        'Ngày tạo phiếu',
        'Tên phiếu',
        'Loại phiếu',
        'Ghi chú',
        'Số tiền',
      ],
    });

    const csv = parser.parse(cashCsvData);

    return csv;
  }
}
