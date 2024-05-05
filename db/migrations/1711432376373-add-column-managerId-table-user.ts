import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnManagerIdTableUser1711432376373
  implements MigrationInterface
{
  name = 'AddColumnManagerIdTableUser1711432376373';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'managerId',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    );

    await queryRunner.createForeignKeys('user', [
      new TableForeignKey({
        columnNames: ['managerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user', 'managerId');
  }
}
