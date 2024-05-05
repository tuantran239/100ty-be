import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateColumnTableBatHo1710836954415 implements MigrationInterface {
  name = 'UpdateColumnTableBatHo1710836954415';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.bat_ho DROP COLUMN IF EXISTS "totalPaymentDue"`,
    );
    await queryRunner.query(
      `ALTER TABLE public.bat_ho DROP COLUMN IF EXISTS "amountPaidByCustomer"`,
    );
    await queryRunner.query(
      `ALTER TABLE public.bat_ho DROP COLUMN IF EXISTS "paymentMethod"`,
    );
    await queryRunner.query(
      `ALTER TABLE public.bat_ho DROP COLUMN IF EXISTS "loanDuration"`,
    );
    await queryRunner.query(
      `ALTER TABLE public.bat_ho DROP COLUMN IF EXISTS "numberOfPayments"`,
    );
    await queryRunner.query(
      `ALTER TABLE public.bat_ho DROP COLUMN IF EXISTS "interestPaymentType"`,
    );

    await queryRunner.addColumns('bat_ho', [
      new TableColumn({
        name: 'loanAmount',
        type: 'bigint',
        isNullable: false,
        default: 0,
      }),
      new TableColumn({
        name: 'fundedAmount',
        type: 'bigint',
        isNullable: false,
        default: 0,
      }),
      new TableColumn({
        name: 'revenueReceived',
        type: 'bigint',
        isNullable: false,
        default: 0,
      }),
      new TableColumn({
        name: 'loanDurationDays',
        type: 'integer',
        isNullable: false,
        default: 0,
      }),
      new TableColumn({
        name: 'deductionDays',
        type: 'integer',
        isNullable: false,
        default: 0,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('bat_ho', [
      'loanAmount',
      'fundedAmount',
      'revenueReceived',
      'loanDurationDays',
      'deductionDays',
    ]);
  }
}
