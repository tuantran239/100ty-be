import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnIsDeductionMoneyTablePaymentHistory1710985909962
  implements MigrationInterface
{
  name = 'AddColumnIsDeductionMoneyTablePaymentHistory1710985909962';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'payment_history',
      new TableColumn({
        name: 'isDeductionMoney',
        type: 'boolean',
        isNullable: true,
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('payment_history', 'isDeductionMoney');
  }
}
