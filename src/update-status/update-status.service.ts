import { Injectable } from '@nestjs/common';
import { CashFilterType } from 'src/common/interface';
import { DebitStatus } from 'src/common/interface/bat-ho';
import { PaymentStatusHistory } from 'src/common/interface/history';
import { createPaymentHistoriesCash } from 'src/common/utils/cash-payload';
import { getBatHoStatus } from 'src/common/utils/status';
import { DatabaseService } from 'src/database/database.service';
import { DataSource } from 'typeorm';

@Injectable()
export class UpdateStatusService {
  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
  ) {}

  async updateBatHoStatus(batHoId: string) {
    await this.databaseService.runTransaction(async (repositories) => {
      const {
        batHoRepository,
        customerRepository,
        paymentHistoryRepository,
        cashRepository,
      } = repositories;

      const batHo = await batHoRepository.findOne({
        where: { id: batHoId },
        relations: ['paymentHistories'],
      });

      if (batHo) {
        const customer = await customerRepository.findOne({
          where: { id: batHo.customerId },
        });

        const status = getBatHoStatus(batHo.paymentHistories ?? []);

        if (
          status == DebitStatus.BAD_DEBIT ||
          status == DebitStatus.RISK_DEBIT
        ) {
          const debtMoney = batHo.paymentHistories.reduce(
            (total, paymentHistory) => {
              if (paymentHistory.paymentStatus != PaymentStatusHistory.FINISH) {
                return total + paymentHistory.payNeed;
              }
              return total;
            },
            0,
          );

          await customerRepository.update(customer.id, {
            debtMoney,
            isDebt: true,
          });
        } else {
          await customerRepository.update(customer.id, {
            debtMoney: 0,
            isDebt: false,
          });
        }

        await batHoRepository.update({ id: batHo.id }, { debitStatus: status });

        const findPaymentHistories = await paymentHistoryRepository.find({
          where: { batHoId: batHo.id },
        });

        const cash = await cashRepository.findOne({
          where: { batHoId, filterType: CashFilterType.RECEIPT_CONTRACT },
        });

        if (cash) {
          cash.contractStatus = status;

          cash.paymentHistories = createPaymentHistoriesCash(
            findPaymentHistories ?? [],
          );

          await cashRepository.save(cash);
        }
      }
    });
  }
}
