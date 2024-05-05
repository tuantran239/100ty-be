import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnsFilterTypeTableCash1712384822913
  implements MigrationInterface
{
  name = 'AddColumnsFilterTypeTableCash1712384822913';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'cash',
      new TableColumn({
        name: 'filterType',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cash', 'filterType');
  }
}
