import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnCreatedAtTableTransactionHistory1717569419492
  implements MigrationInterface
{
  name = 'AddColumnCreatedAtTableTransactionHistory1717569419492';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'transaction_history',
      new TableColumn({
        name: 'createdAt',
        type: 'date',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('transaction_history', 'createdAt');
  }
}
