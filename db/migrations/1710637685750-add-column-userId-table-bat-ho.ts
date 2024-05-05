import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnUserIdTableBatHo1710637685750
  implements MigrationInterface
{
  name = 'AddColumnUserIdTableBatHo1710637685750';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'bat_ho',
      new TableColumn({
        name: 'userId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKeys('bat_ho', [
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bat_ho', 'userId');
  }
}
