import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnCreateAtTableCash1709284214045
  implements MigrationInterface
{
  name = 'AddColumnCreateAtTableCash1709284214045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'cash',
      new TableColumn({
        name: 'createAt',
        type: 'date',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('cash', 'createAt');
  }
}
