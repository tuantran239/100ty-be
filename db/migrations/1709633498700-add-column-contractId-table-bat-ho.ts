import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnContractIdTableBatHo1709633498700
  implements MigrationInterface
{
  name = 'AddColumnContractIdTableBatHo1709633498700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'bat_ho',
      new TableColumn({
        name: 'contractId',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bat_ho', 'contractId');
  }
}
