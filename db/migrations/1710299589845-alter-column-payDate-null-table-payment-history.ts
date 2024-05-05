import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterColumnPayDateNullTablePaymentHistory1710299589845
  implements MigrationInterface
{
  name = 'AlterColumnPayDateNullTablePaymentHistory1710299589845';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE payment_history ALTER COLUMN "payDate" DROP NOT NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('');
  }
}
