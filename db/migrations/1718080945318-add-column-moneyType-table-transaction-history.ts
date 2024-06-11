import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnMoneyTypeTableTransactionHistory1718080945318
  implements MigrationInterface
{
  name = 'AddColumnMoneyTypeTableTransactionHistory1718080945318';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'transaction_history',
      new TableColumn({
        name: 'moneyType',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('transaction_history', 'moneyType');
  }
}
