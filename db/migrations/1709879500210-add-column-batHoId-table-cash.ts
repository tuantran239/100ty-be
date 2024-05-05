import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddColumnBatHoIdTableCash1709879500210
  implements MigrationInterface
{
  name = 'AddColumnBatHoIdTableCash1709879500210';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'cash',
      new TableColumn({
        name: 'batHoId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKeys('cash', [
      new TableForeignKey({
        columnNames: ['batHoId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'bat_ho',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cash', 'batHoId');
  }
}
