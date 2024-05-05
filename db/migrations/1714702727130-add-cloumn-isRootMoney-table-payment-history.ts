import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCloumnIsRootMoneyTablePaymentHistory1714702727130
  implements MigrationInterface
{
  name = 'AddCloumnIsRootMoneyTablePaymentHistory1714702727130';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'payment_history',
      new TableColumn({
        name: 'isRootMoney',
        type: 'boolean',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('payment_history', 'isRootMoney');
  }
}
