import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnPaymentHistoryIdTableCash1710844682351
  implements MigrationInterface
{
  name = 'AddColumnPaymentHistoryIdTableCash1710844682351';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'cash',
      new TableColumn({
        name: 'paymentHistoryId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKeys('cash', [
      new TableForeignKey({
        columnNames: ['paymentHistoryId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payment_history',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cash', 'paymentHistoryId');
  }
}
