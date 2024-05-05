import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnCashTypeIdTableCash1713244969650
  implements MigrationInterface
{
  name = 'AddColumnCashTypeIdTableCash1713244969650';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'cash',
      new TableColumn({
        name: 'cashTypeId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'cash',
      new TableForeignKey({
        columnNames: ['cashTypeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'group_cash_type',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cash', 'cashTypeId');
  }
}
