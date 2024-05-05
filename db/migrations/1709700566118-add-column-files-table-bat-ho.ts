import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnFilesTableBatHo1709700566118
  implements MigrationInterface
{
  name = 'AddColumnFilesTableBatHo1709700566118';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'bat_ho',
      new TableColumn({
        name: 'files',
        type: 'varchar[]',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bat_ho', 'files');
  }
}
