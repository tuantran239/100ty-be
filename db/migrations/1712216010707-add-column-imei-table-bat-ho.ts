import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnImeiTableBatHo1712216010707
  implements MigrationInterface
{
  name = 'AddColumnImeiTableBatHo1712216010707';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'bat_ho',
      new TableColumn({
        name: 'imei',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bat_ho', 'imei');
  }
}
