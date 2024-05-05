import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnGroupIdTableCash1713332694292
  implements MigrationInterface
{
  name = 'AddColumnGroupIdTableCash1713332694292';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'cash',
      new TableColumn({
        name: 'groupId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'cash',
      new TableForeignKey({
        columnNames: ['groupId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'group_cash',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cash', 'groupId');
  }
}
