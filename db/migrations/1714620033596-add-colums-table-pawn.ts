import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumsTablePawn1714620033596 implements MigrationInterface {
  name = 'AddColumsTablePawn1714620033596';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('pawn', [
      new TableColumn({
        name: 'loanPaymentType',
        type: 'varchar',
        isNullable: false,
      }),
      new TableColumn({
        name: 'loanAmount',
        type: 'bigint',
        isNullable: false,
      }),
      new TableColumn({
        name: 'paymentPeriod',
        type: 'integer',
        isNullable: false,
      }),
      new TableColumn({
        name: 'paymentPeriodType',
        type: 'varchar',
        isNullable: false,
      }),
      new TableColumn({
        name: 'numOfPayment',
        type: 'text',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'contractId',
        type: 'varchar',
        isNullable: false,
      }),
      new TableColumn({
        name: 'loanDate',
        type: 'date',
        isNullable: false,
      }),
      new TableColumn({
        name: 'noteContract',
        type: 'text',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'debitStatus',
        type: 'varchar',
        isNullable: false,
      }),
      new TableColumn({
        name: 'pawnInfo',
        type: 'jsonb',
        isNullable: true,
        default: null,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('pawn', [
      'loanPaymentType',
      'loanAmount',
      'paymentPeriod',
      'paymentPeriodType',
      'numOfPayment',
      'contractId',
      'loanDate',
      'noteContract',
      'debitStatus',
      'pawnInfo',
    ]);
  }
}
