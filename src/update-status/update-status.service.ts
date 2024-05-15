import { Injectable } from '@nestjs/common';
import { CashFilterType } from 'src/common/interface';
import { createPaymentHistoriesCash } from 'src/common/utils/cash-payload';
import { getBatHoStatus, getPawnStatus } from 'src/common/utils/status';
import { ContractService } from 'src/contract/contract.service';
import { DatabaseService } from 'src/database/database.service';
import { DataSource } from 'typeorm';

@Injectable()
export class UpdateStatusService {
  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
    private contractService: ContractService,
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

        await batHoRepository.update({ id: batHo.id }, { debitStatus: status });

        const customerBadDebitContract =
          await this.contractService.listBadDebitContractCustomer(customer.id);

        await customerRepository.update(customer.id, {
          debtMoney: customerBadDebitContract.total,
          isDebt: customerBadDebitContract.total !== 0,
        });

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

  async updatePawnStatus(pawnId: string) {
    await this.databaseService.runTransaction(async (repositories) => {
      const {
        pawnRepository,
        customerRepository,
        paymentHistoryRepository,
        cashRepository,
      } = repositories;

      const pawn = await pawnRepository.findOne({
        where: { id: pawnId },
        relations: ['paymentHistories'],
      });

      if (pawn) {
        const customer = await customerRepository.findOne({
          where: { id: pawn.customerId },
        });

        const status = getPawnStatus(pawn.paymentHistories ?? []);

        await pawnRepository.update({ id: pawn.id }, { debitStatus: status });

        const customerBadDebitContract =
          await this.contractService.listBadDebitContractCustomer(customer.id);

        await customerRepository.update(customer.id, {
          debtMoney: customerBadDebitContract.total,
          isDebt: customerBadDebitContract.total !== 0,
        });

        const findPaymentHistories = await paymentHistoryRepository.find({
          where: { pawnId: pawn.id },
        });

        const cash = await cashRepository.findOne({
          where: { pawnId, filterType: CashFilterType.RECEIPT_CONTRACT },
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
