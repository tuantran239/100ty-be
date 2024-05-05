import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterColumnPaymentHistoryTablePaymentHistory1710911274405
  implements MigrationInterface
{
  name = 'AlterColumnPaymentHistoryTablePaymentHistory1710911274405';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE payment_history ALTER COLUMN "paymentStatus" DROP NOT NULL;`,
    );

    await queryRunner.query(
      `ALTER TABLE payment_history ALTER COLUMN "paymentStatus" TYPE VARCHAR(50);`,
    );

    await queryRunner.query(
      `ALTER TABLE payment_history ALTER "paymentStatus" SET DEFAULT null;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('');
  }
}
