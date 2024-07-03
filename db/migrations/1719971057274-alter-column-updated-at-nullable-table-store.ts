import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterColumnUpdatedAtNullableTableStore1719971057274
  implements MigrationInterface
{
  name = 'AlterColumnUpdatedAtNullableTableStore1719971057274';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('store', 'updated_at');

    await queryRunner.addColumn(
      'store',
      new TableColumn({
        name: 'updated_at',
        type: 'timestamptz',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('store', 'updated_at');
  }
}
