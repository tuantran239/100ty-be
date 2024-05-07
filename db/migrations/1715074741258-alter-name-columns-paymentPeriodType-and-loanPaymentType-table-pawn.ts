import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterNameColumnsPaymentPeriodTypeAndLoanPaymentTypeTablePawn1715074741258
  implements MigrationInterface
{
  name =
    'AlterNameColumnsPaymentPeriodTypeAndLoanPaymentTypeTablePawn1715074741258';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE pawn
      RENAME COLUMN "paymentPeriodType" TO "interestType";`,
    );
    await queryRunner.query(
      `ALTER TABLE pawn
        RENAME COLUMN "loanPaymentType" TO "paymentPeriodType";`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('');
  }
}
