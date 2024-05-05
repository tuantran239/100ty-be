import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnIsContractAndContractTypeTableCash1709869914289
  implements MigrationInterface
{
  name = 'AddColumnIsContractAndContractTypeTableCash1709869914289';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('cash', [
      new TableColumn({
        name: 'isContract',
        type: 'boolean',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'contractType',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('cash', ['isContract', 'contractType']);
  }
}
