import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnGroupCashIdTableGroupCashType1713244453384
  implements MigrationInterface
{
  name = 'AddColumnGroupCashIdTableGroupCashType1713244453384';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'group_cash_type',
      new TableColumn({
        name: 'groupCashId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'group_cash_type',
      new TableForeignKey({
        columnNames: ['groupCashId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'group_cash',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('group_cash_type', 'groupCashId');
  }
}
