import { Injectable } from '@nestjs/common';
import { BatHo } from 'src/bat-ho/bat-ho.entity';
import { ContractType } from 'src/common/interface';
import { Contract } from 'src/common/interface/contract';
import { PaymentStatusHistory } from 'src/common/interface/history';
import {
  calculateLateAndBadPaymentIcloud,
  calculateLateAndBadPaymentPawn,
} from 'src/common/utils/calculate';
import { formatDate } from 'src/common/utils/time';
import { DatabaseService } from 'src/database/database.service';
import { Pawn } from 'src/pawn/pawn.entity';
import { DataSource, FindManyOptions } from 'typeorm';

@Injectable()
export class ContractService {
  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
  ) {}

  async listContractIcloud(
    options: FindManyOptions<BatHo>,
  ): Promise<Contract[]> {
    const { batHoRepository } = this.databaseService.getRepositories();

    const iClouds = await batHoRepository.find(options);

    const icloudContracts = iClouds.map((icloud) => {
      const paymentHistories = icloud.paymentHistories;
      const { latePaymentDay, latePaymentMoney, badDebitMoney } =
        calculateLateAndBadPaymentIcloud(
          paymentHistories ?? [],
          icloud.debitStatus,
        );

      const moneyPaid = paymentHistories.reduce((total, paymentHistory) => {
        if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
          return (total += paymentHistory.payMoney);
        }
        return total;
      }, 0);

      const deductionMoney = paymentHistories.reduce(
        (total, paymentHistory) => {
          if (paymentHistory.isDeductionMoney) {
            return (total += paymentHistory.payMoney);
          }
          return total;
        },
        0,
      );

      return {
        paymentHistories,
        customer: icloud.customer,
        user: icloud.user,
        contractId: icloud.contractId,
        loanDate: formatDate(icloud.loanDate),
        debitStatus: icloud.debitStatus,
        loanAmount: icloud.loanAmount,
        latePaymentMoney,
        badDebitMoney,
        rootMoney: icloud.loanAmount,
        interestMoney: icloud.revenueReceived - icloud.loanAmount,
        latePaymentDay,
        moneyMustPay: icloud.revenueReceived,
        moneyPaid,
        revenueReceived: icloud.revenueReceived,
        contractType: ContractType.BAT_HO,
        disbursementMoney: icloud.fundedAmount,
        deductionMoney,
      } as Contract;
    });

    return icloudContracts;
  }

  async listContractPawn(options: FindManyOptions<Pawn>): Promise<Contract[]> {
    const { pawnRepository } = this.databaseService.getRepositories();

    const pawns = await pawnRepository.find(options);

    const pawnContracts = pawns.map((pawn) => {
      const paymentHistories = pawn.paymentHistories;
      const { latePaymentPeriod, latePaymentMoney, badDebitMoney } =
        calculateLateAndBadPaymentPawn(
          paymentHistories ?? [],
          pawn.debitStatus,
        );

      const moneyPaid = paymentHistories.reduce((total, paymentHistory) => {
        if (paymentHistory.paymentStatus === PaymentStatusHistory.FINISH) {
          return (total += paymentHistory.payMoney);
        }
        return total;
      }, 0);

      const deductionMoney = paymentHistories.reduce(
        (total, paymentHistory) => {
          if (paymentHistory.isDeductionMoney) {
            return (total += paymentHistory.payMoney);
          }
          return total;
        },
        0,
      );

      return {
        paymentHistories,
        customer: pawn.customer,
        user: pawn.user,
        contractId: pawn.contractId,
        loanDate: formatDate(pawn.loanDate),
        debitStatus: pawn.debitStatus,
        loanAmount: pawn.loanAmount,
        latePaymentMoney,
        badDebitMoney,
        rootMoney: pawn.loanAmount,
        interestMoney: pawn.revenueReceived - pawn.loanAmount,
        latePaymentDay: latePaymentPeriod * pawn.paymentPeriod,
        moneyMustPay: pawn.revenueReceived,
        moneyPaid,
        revenueReceived: pawn.revenueReceived,
        contractType: ContractType.CAM_DO,
        deductionMoney,
        disbursementMoney: pawn.loanAmount,
      } as Contract;
    });

    return pawnContracts;
  }

  async listContract(
    contractType?: string,
    options?: FindManyOptions<any>,
  ): Promise<Contract[]> {
    let contracts: Contract[] = [];

    switch (contractType) {
      case ContractType.BAT_HO:
        {
          const icloudContracts = await this.listContractIcloud(options);

          contracts = contracts.concat(contracts, icloudContracts);
        }
        break;
      case ContractType.CAM_DO:
        {
          const pawnContracts = await this.listContractPawn(options);

          contracts = contracts.concat(contracts, pawnContracts);
        }
        break;
      default: {
        const icloudContracts = await this.listContractIcloud(options);

        const pawnContracts = await this.listContractPawn(options);

        contracts = contracts.concat(contracts, icloudContracts, pawnContracts);
      }
    }

    return contracts;
  }
}
