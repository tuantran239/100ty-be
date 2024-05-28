import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnPaymentHistoryIdTableTransactionHistory1716867098955
  implements MigrationInterface
{
  name = 'AddColumnPaymentHistoryIdTableTransactionHistory1716867098955';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'transaction_history',
      new TableColumn({
        name: 'paymentHistoryId',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    );

    await queryRunner.createForeignKey(
      'transaction_history',
      new TableForeignKey({
        columnNames: ['paymentHistoryId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payment_history',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('transaction_history', 'paymentHistoryId');
  }
}
