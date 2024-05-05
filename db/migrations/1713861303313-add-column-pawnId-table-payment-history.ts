import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnPawnIdTablePaymentHistory1713861303313
  implements MigrationInterface
{
  name = 'AddColumnPawnIdTablePaymentHistory1713861303313';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'payment_history',
      new TableColumn({
        name: 'pawnId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'payment_history',
      new TableForeignKey({
        columnNames: ['pawnId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pawn',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('payment_history', 'pawnId');
  }
}
