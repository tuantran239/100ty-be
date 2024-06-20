import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnUserIdTableGroupCash1718850364404
  implements MigrationInterface
{
  name = 'AddColumnUserIdTableGroupCash1718850364404';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'group_cash',
      new TableColumn({
        name: 'userId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKeys('group_cash', [
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('group_cash', 'userId');
  }
}
