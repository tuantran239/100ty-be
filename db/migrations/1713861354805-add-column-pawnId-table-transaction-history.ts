import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnPawnIdTableTransactionHistory1713861354805
  implements MigrationInterface
{
  name = 'AddColumnPawnIdTableTransactionHistory1713861354805';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'transaction_history',
      new TableColumn({
        name: 'pawnId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'transaction_history',
      new TableForeignKey({
        columnNames: ['pawnId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pawn',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('transaction_history', 'pawnId');
  }
}
