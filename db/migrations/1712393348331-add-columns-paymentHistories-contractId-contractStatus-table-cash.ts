import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddColumnsPaymentHistoriesContractIdContractStatusTableCash1712393348331
  implements MigrationInterface
{
  name =
    'AddColumnsPaymentHistoriesContractIdContractStatusTableCash1712393348331';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('cash', [
      new TableColumn({
        name: 'paymentHistories',
        type: 'jsonb',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'contractId',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'contractStatus',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('cash', [
      'paymentHistories',
      'contractId',
      'contractStatus',
    ]);
  }
}
